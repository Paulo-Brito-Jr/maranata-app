import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
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

  const trilha = await prisma.trilha.findUnique({
    where: { id },
    include: { etapas: { orderBy: { ordem: "asc" }, take: 1, select: { id: true } } },
  });
  if (!trilha || !trilha.ativa)
    return NextResponse.json({ erro: "Trilha inativa" }, { status: 404 });

  const j = await prisma.pessoaJornada.upsert({
    where: { trilhaId_membroId: { trilhaId: id, membroId: membro.id } },
    create: {
      trilhaId: id,
      membroId: membro.id,
      etapaAtualId: trilha.etapas[0]?.id ?? null,
    },
    update: {},
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: j.id });
}
