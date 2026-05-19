import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  pedido: z.string().min(5).max(1500),
  anonimo: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ erro: "nao autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ erro: "payload invalido" }, { status: 400 });
  }

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });

  const pedido = await prisma.pedidoOracao.create({
    data: {
      pedido: parsed.data.pedido,
      status: "ABERTO",
      membroId: membro?.id ?? null,
      nomeAvulso: parsed.data.anonimo ? null : membro ? null : user.name,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: pedido.id });
}
