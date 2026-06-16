import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-please-change");
const COOKIE = "chaosheng_token";

export async function signToken(username: string) {
  return await new SignJWT({ username }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d").sign(SECRET);
}

export async function verifyToken(token?: string): Promise<boolean> {
  if (!token) return false;
  try { await jwtVerify(token, SECRET); return true; } catch { return false; }
}

export const COOKIE_NAME = COOKIE;
export const CREDENTIALS = {
  username: process.env.AUTH_USERNAME ?? "doctor1",
  password: process.env.AUTH_PASSWORD ?? "changeme",
};
