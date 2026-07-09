import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "dros_session";

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET 未配置");
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  roleCode: string;
  roleId: string;
  dataScope: string;
  orgId?: string | null;
  region?: string | null;
  clinicId?: string | null;
}

export async function signToken(payload: SessionPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(p: string) {
  return bcrypt.hash(p, 10);
}

export async function verifyPassword(p: string, hash: string) {
  return bcrypt.compare(p, hash);
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = cookies().get(SESSION_COOKIE);
  if (!c?.value) return null;
  return verifyToken(c.value);
}

export async function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}
