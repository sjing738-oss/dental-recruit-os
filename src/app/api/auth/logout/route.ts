import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logAudit({
      actorId: session.userId,
      action: AUDIT_ACTIONS.LOGOUT,
      objectType: "user",
      objectId: session.userId,
    });
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
