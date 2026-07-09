import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";

export async function requireSession(): Promise<SessionPayload | null> {
  return await getSession();
}

export function unauthorized() {
  return NextResponse.json({ message: "未登录或会话已过期" }, { status: 401 });
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function serverError(message = "服务器异常") {
  return NextResponse.json({ message }, { status: 500 });
}
