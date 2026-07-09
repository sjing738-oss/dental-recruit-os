import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ROLE_NAMES } from "@/lib/constants";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }
  return NextResponse.json({
    session,
    roleName: ROLE_NAMES[session.roleCode] || session.roleCode,
  });
}
