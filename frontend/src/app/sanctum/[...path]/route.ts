import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const { path } = await ctx.params;
    const url = `${BACKEND}/sanctum/${path.join("/")}`;

    const headers: Record<string, string> = { accept: "application/json" };
    const cookie = request.headers.get("cookie");
    if (cookie) headers.cookie = cookie;

    const upstream = await fetch(url, { headers });
    const body = upstream.status !== 204 ? await upstream.text() : null;
    const res = new NextResponse(body, { status: upstream.status });

    for (const c of upstream.headers.getSetCookie()) {
      res.headers.append("set-cookie", c);
    }

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sanctum proxy]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
