import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { enviarPush } from "@/lib/push";

const schema = z.object({
  criancaId: z.string().min(1),
  turmaId: z.string().min(1),
  observacoes: z.string().max(500).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole(
      "SUPER_ADMIN",
      "PASTOR_DIRETORIA",
      "ADMIN_IGREJA",
      "SECRETARIA",
      "KIDS_RESPONSAVEL",
    );
  } catch {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ erro: "Payload inválido" }, { status: 400 });

  const aberto = await prisma.kidsCheckin.findFirst({
    where: { criancaId: parsed.data.criancaId, saidaEm: null },
    select: { id: true },
  });
  if (aberto) {
    return NextResponse.json(
      { erro: "Esta criança já está em sala (check-in ativo)", checkinId: aberto.id },
      { status: 409 },
    );
  }

  const checkin = await prisma.kidsCheckin.create({
    data: {
      criancaId: parsed.data.criancaId,
      turmaId: parsed.data.turmaId,
      observacoes: parsed.data.observacoes ?? null,
    },
    include: {
      crianca: { select: { nome: true, igrejaId: true } },
      turma: { select: { nome: true } },
    },
  });

  const responsaveis = await prisma.kidsResponsavel.findMany({
    where: { criancaId: parsed.data.criancaId, membroId: { not: null } },
    select: { membro: { select: { usuario: { select: { id: true } } } } },
  });
  const usuarioIds = responsaveis
    .map((r) => r.membro?.usuario?.id)
    .filter((id): id is string => !!id);

  if (usuarioIds.length > 0) {
    void enviarPush(
      { tipo: "USUARIOS", usuarioIds },
      {
        titulo: `${checkin.crianca.nome} está na sala ${checkin.turma.nome} ✓`,
        corpo: "Check-in confirmado. Você recebeu o ticket de retirada.",
        url: `/membro/historico`,
        tag: `kids-checkin-${checkin.id}`,
      },
    ).catch(() => null);
  }

  return NextResponse.json({ ok: true, checkinId: checkin.id });
}
