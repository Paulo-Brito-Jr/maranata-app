import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  posicaoSeg: z.number().int().min(0).max(60 * 60 * 6),
  concluido: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!membro) return NextResponse.json({ erro: "Sem cadastro de membro" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ erro: "Payload inválido" }, { status: 400 });

  await prisma.pregacaoProgresso.upsert({
    where: { pregacaoId_membroId: { pregacaoId: id, membroId: membro.id } },
    create: {
      pregacaoId: id,
      membroId: membro.id,
      posicaoSeg: parsed.data.posicaoSeg,
      concluido: parsed.data.concluido ?? false,
    },
    update: {
      posicaoSeg: parsed.data.posicaoSeg,
      concluido: parsed.data.concluido ?? false,
      ultimaVistaEm: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
