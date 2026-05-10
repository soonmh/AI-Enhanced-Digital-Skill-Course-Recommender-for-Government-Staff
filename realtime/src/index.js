require("dotenv").config();

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const axios = require("axios");

const app = express();
const httpServer = createServer(app);

const LARAVEL_URL = process.env.LARAVEL_URL || "http://localhost:8000";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, credentials: true },
});

// Socket.io auth middleware — validate Sanctum token via Laravel
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication required"));

  try {
    const resp = await axios.get(`${LARAVEL_URL}/api/user`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    socket.data.user = resp.data;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

const redis = new Redis(REDIS_URL);
const subscriber = new Redis(REDIS_URL);
const onlineKey = "online_users";

io.on("connection", async (socket) => {
  const userId = String(socket.data.user.id);

  // Join personal room for targeted notifications
  socket.join(`user:${userId}`);

  // Track online
  await redis.sadd(onlineKey, userId);
  io.emit("online_status", { userId: Number(userId), online: true });

  socket.on("disconnect", async () => {
    // Check if user has other active sockets (multi-tab support)
    const userSockets = await io.in(`user:${userId}`).fetchSockets();
    const stillConnected = userSockets.some((s) => s.id !== socket.id);
    if (!stillConnected) {
      await redis.srem(onlineKey, userId);
      io.emit("online_status", { userId: Number(userId), online: false });
    }
  });
});

// Subscribe to Laravel events via Redis Pub/Sub
subscriber.subscribe("notifications", "dashboard_updates");

subscriber.on("message", (channel, message) => {
  const data = JSON.parse(message);

  if (channel === "notifications") {
    // data = { recipient_id, notification }
    io.to(`user:${data.recipient_id}`).emit("notification.new", data.notification);
  }

  if (channel === "dashboard_updates") {
    // data = { event, payload }
    io.emit("dashboard.update", data);
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Realtime server running on port ${PORT}`);
});
