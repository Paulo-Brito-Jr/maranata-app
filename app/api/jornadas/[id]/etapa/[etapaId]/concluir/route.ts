import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; etapaId: string }> },
) {
  const { id, etapaId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!membro) return NextResponse.json({ erro: "Sem cadastro de membro" }, { status: 403 });

  const jornada = await prisma.pessoaJornada.findUnique({
    where: { trilhaId_membroId: { trilhaId: id, membroId: membro.id } },
    include: {
      trilha: { include: { etapas: { orderBy: { ordem: "asc" }, select: { id: true } } } },
      progressos: { select: { etapaId: true } },
    },
  });
  if (!jornada) return NextResponse.json({ erro: "Inscreva-se primeiro" }, { status: 404 });

  const etapas = jornada.trilha.etapas.map((e) => e.id);
  const concluidas = new Set(jornada.progressos.map((p) => p.etapaId));
  const proximaIndex = etapas.findIndex((e) => !concluidas.has(e));
  if (etapas[proximaIndex] !== etapaId) {
    return NextResponse.json(
      { erro: "Conclua a etapa anterior primeiro" },
      { status: 400 },
    );
  }

  await prisma.etapaProgresso.upsert({
    where: {
      pessoaJornadaId_etapaId: {
        pessoaJornadaId: jornada.id,
        etapaId,
      },
    },
    create: { pessoaJornadaId: jornada.id, etapaId },
    update: {},
  });

  concluidas.add(etapaId);
  const novaProx = etapas.findIndex((e) => !concluidas.has(e));
  const concluiuTudo = novaProx === -1;

  await prisma.pessoaJornada.update({
    where: { id: jornada.id },
    data: {
      etapaAtualId: concluiuTudo ? null : etapas[novaProx],
      status: concluiuTudo ? "CONCLUIDA" : jornada.status,
      concluidaEm: concluiuTudo ? new Date() : jornada.concluidaEm,
    },
  });

  return NextResponse.json({ ok: true, concluiuTudo });
}
