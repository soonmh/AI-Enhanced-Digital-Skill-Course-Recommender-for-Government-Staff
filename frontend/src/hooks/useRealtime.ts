"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { toast } from "sonner";
import { mutate } from "swr";

export function useRealtime() {
  const { data: session } = useSession();
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!session?.accessToken) return;

    const socket = getSocket(session.accessToken);

    socket.on("notification.new", (notification) => {
      toast.info(notification.title, { description: notification.body });
      mutate("/api/notifications");
      mutate("/api/notifications/unread-count");
    });

    socket.on("dashboard.update", () => {
      mutate("/api/dashboard");
      mutate("/api/reports/staff-analysis");
      mutate("/api/reports/course-progress");
      mutate("/api/admin/users");
    });

    socket.on("online_status", ({ userId, online }: { userId: number; online: boolean }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    return () => {
      disconnectSocket();
    };
  }, [session?.accessToken]);

  return { onlineUsers };
}
