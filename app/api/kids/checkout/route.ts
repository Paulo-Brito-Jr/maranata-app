import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { enviarPush } from "@/lib/push";

const schema = z.object({
  etiquetaCode: z.string().min(4),
  retiradaPor: z.string().min(2).max(120),
  retiradaDoc: z.string().max(40).optional(),
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

  const checkin = await prisma.kidsCheckin.findUnique({
    where: { etiquetaCode: parsed.data.etiquetaCode },
    include: {
      crianca: { select: { nome: true } },
      turma: { select: { nome: true } },
    },
  });

  if (!checkin) {
    return NextResponse.json({ erro: "Ticket não encontrado" }, { status: 404 });
  }
  if (checkin.saidaEm) {
    return NextResponse.json(
      {
        erro: "Esta criança já foi retirada",
        retiradaPor: checkin.retiradaPor,
        saidaEm: checkin.saidaEm,
      },
      { status: 409 },
    );
  }

  await prisma.kidsCheckin.update({
    where: { id: checkin.id },
    data: {
      saidaEm: new Date(),
      retiradaPor: parsed.data.retiradaPor,
      retiradaDoc: parsed.data.retiradaDoc ?? null,
    },
  });

  const responsaveis = await prisma.kidsResponsavel.findMany({
    where: { criancaId: checkin.criancaId, membroId: { not: null } },
    select: { membro: { select: { usuario: { select: { id: true } } } } },
  });
  const usuarioIds = responsaveis
    .map((r) => r.membro?.usuario?.id)
    .filter((id): id is string => !!id);
  if (usuarioIds.length > 0) {
    void enviarPush(
      { tipo: "USUARIOS", usuarioIds },
      {
        titulo: `${checkin.crianca.nome} foi retirada da sala ${checkin.turma.nome}`,
        corpo: `Por ${parsed.data.retiradaPor}.`,
        tag: `kids-checkout-${checkin.id}`,
      },
    ).catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    crianca: checkin.crianca.nome,
    turma: checkin.turma.nome,
  });
}
