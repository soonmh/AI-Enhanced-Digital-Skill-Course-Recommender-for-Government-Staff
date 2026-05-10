import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function proxy(request: NextRequest, segments: string[]) {
  const url = `${BACKEND}/api/${segments.join("/")}`;

  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };

  // Read Sanctum token from NextAuth JWT and use Bearer auth
  const jwt = await getToken({ req: request });
  if (jwt?.accessToken) {
    headers.authorization = `Bearer ${jwt.accessToken}`;
  }

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const upstream = await fetch(url, init);
  const data = upstream.status !== 204 ? await upstream.text() : null;
  return new NextResponse(data, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, ctx: RouteContext) {
  try {
    const { path } = await ctx.params;
    return await proxy(request, path);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api proxy]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
