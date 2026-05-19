import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({ texto: z.string().min(3).max(2000) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "Faça login pra comentar" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ erro: "Comentário inválido" }, { status: 400 });

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true, nome: true },
  });

  await prisma.pregacaoComentario.create({
    data: {
      pregacaoId: id,
      texto: parsed.data.texto,
      membroId: membro?.id,
      nomeAvulso: membro ? null : user.name,
      aprovado: false,
    },
  });

  return NextResponse.json({ ok: true, aprovado: false });
}
