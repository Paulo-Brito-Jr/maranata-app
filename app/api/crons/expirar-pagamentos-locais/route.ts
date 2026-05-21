import { NextResponse } from "next/server";
import { StatusPagamentoLocal } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Expira pagamentos locais que ficaram AGUARDANDO por mais de 48h
 * sem o membro informar nem o admin confirmar. Cancela inscrição
 * vinculada (libera vaga). Vercel cron diário (10:00 UTC).
 */
export async function GET(req: Request) {
  const headerKey = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  // Vercel cron injeta header `Authorization: Bearer <CRON_SECRET>`; localmente
  // aceita também query ?key=… pra teste manual.
  const url = new URL(req.url);
  const queryKey = url.searchParams.get("key");
  if (expected && headerKey !== `Bearer ${expected}` && queryKey !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const limite = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // 1. acha quem deve expirar
  const pendentes = await prisma.pagamentoLocal.findMany({
    where: {
      status: StatusPagamentoLocal.AGUARDANDO,
      criadoEm: { lt: limite },
    },
    select: { id: true },
  });

  if (pendentes.length === 0) {
    return NextResponse.json({ ok: true, expirados: 0 });
  }

  const ids = pendentes.map((p) => p.id);

  // 2. cancela pagamentos
  await prisma.pagamentoLocal.updateMany({
    where: { id: { in: ids } },
    data: {
      status: StatusPagamentoLocal.CANCELADO,
      canceladoEm: new Date(),
      canceladoMotivo: "Expirou após 48h sem confirmação",
    },
  });

  // 3. cancela inscrições associadas (libera vaga)
  await prisma.inscricaoEvento.updateMany({
    where: { pagamentoLocalId: { in: ids } },
    data: { status: "CANCELADA" },
  });

  return NextResponse.json({ ok: true, expirados: ids.length, ids });
}
