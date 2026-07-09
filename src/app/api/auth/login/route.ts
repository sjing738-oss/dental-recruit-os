import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setSessionCookie, type SessionPayload } from "@/lib/auth";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "请输入邮箱和密码" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ message: "账号不存在或已停用" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "邮箱或密码错误" }, { status: 401 });
    }

    const payload: SessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      roleCode: user.role.code,
      roleId: user.roleId,
      dataScope: user.role.dataScope,
      orgId: user.orgId,
      region: user.region,
      clinicId: user.clinicId,
    };

    const token = await signToken(payload);
    await setSessionCookie(token);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAudit({
      actorId: user.id,
      action: AUDIT_ACTIONS.LOGIN,
      objectType: "user",
      objectId: user.id,
    });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      role: { code: user.role.code, name: user.role.name, dataScope: user.role.dataScope },
    });
  } catch (e) {
    console.error("[login] error:", e);
    return NextResponse.json({ message: "登录异常，请重试" }, { status: 500 });
  }
}
