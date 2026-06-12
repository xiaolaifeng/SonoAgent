import { NextRequest } from "next/server";
import { signToken, COOKIE_NAME, CREDENTIALS } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    const token = await signToken(username);
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`,
      },
    });
  }
  return Response.json({ error: "用户名或密码错误" }, { status: 401 });
}
