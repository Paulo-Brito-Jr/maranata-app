import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "payload invalido" }, { status: 400 });
  }

  const user = await getCurrentUser();
  const ua = req.headers.get("user-agent")?.slice(0, 250) ?? null;

  // Tenta vincular ao Usuario interno pelo maranataKeySub ou email
  let usuarioId: string | null = null;
  if (user) {
    const u = await prisma.usuario.findFirst({
      where: {
        OR: [{ maranataKeySub: user.sub }, { email: user.email }],
      },
      select: { id: true },
    });
    usuarioId = u?.id ?? null;
  }

  const data = {
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    authKey: parsed.data.keys.auth,
    userAgent: ua,
    ativa: true,
    usuarioId,
  };

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: data,
    update: {
      ativa: true,
      p256dh: data.p256dh,
      authKey: data.authKey,
      userAgent: data.userAgent,
      usuarioId: data.usuarioId,
    },
  });

  return NextResponse.json({ id: sub.id, ok: true });
}
