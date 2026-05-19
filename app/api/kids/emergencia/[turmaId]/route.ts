import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { enviarPush } from "@/lib/push";

const schema = z.object({
  mensagem: z.string().min(3).max(280).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ turmaId: string }> },
) {
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

  const { turmaId } = await params;
  const json = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  const mensagem =
    (parsed.success && parsed.data.mensagem) ||
    "Atenção: equipe Kids está chamando os responsáveis. Procure a sala agora.";

  const turma = await prisma.kidsTurma.findUnique({
    where: { id: turmaId },
    select: { nome: true, sala: true, igreja: { select: { nome: true } } },
  });
  if (!turma) return NextResponse.json({ erro: "Turma não encontrada" }, { status: 404 });

  const ativos = await prisma.kidsCheckin.findMany({
    where: { turmaId, saidaEm: null },
    include: {
      crianca: {
        select: {
          nome: true,
          responsaveis: {
            where: { membroId: { not: null } },
            select: { membro: { select: { usuario: { select: { id: true } } } } },
          },
        },
      },
    },
  });

  const usuarioIds = Array.from(
    new Set(
      ativos
        .flatMap((c) =>
          c.crianca.responsaveis.map((r) => r.membro?.usuario?.id ?? null),
        )
        .filter((id): id is string => !!id),
    ),
  );

  let enviados = 0;
  if (usuarioIds.length > 0) {
    const r = await enviarPush(
      { tipo: "USUARIOS", usuarioIds },
      {
        titulo: `🚨 Emergência Kids · ${turma.nome}`,
        corpo: `${turma.igreja.nome}${turma.sala ? ` · sala ${turma.sala}` : ""}: ${mensagem}`,
        tag: `kids-emergencia-${turmaId}`,
      },
    );
    enviados = r.enviados;
  }

  await prisma.pushNotification.create({
    data: {
      titulo: `🚨 Emergência Kids · ${turma.nome}`,
      corpo: mensagem,
      alvo: "CUSTOM",
      enviadoEm: new Date(),
      totalEnviado: enviados,
      filtroJson: { tipo: "kids-emergencia", turmaId, usuarioIds },
    },
  });

  return NextResponse.json({
    ok: true,
    avisados: usuarioIds.length,
    enviados,
    ativos: ativos.length,
  });
}
