import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mapSafe2PayStatus, verifyWebhookSignature } from "@/lib/safe2pay";
import type { Safe2PayStatus } from "@/lib/safe2pay";

const SAFE2PAY_TO_DB = {
  PAID: "PAGA",
  CANCELLED: "CANCELADA",
  REFUNDED: "REEMBOLSADA",
  FAILED: "FALHOU",
  AUTHORIZED: "PENDENTE",
  PENDING: "PENDENTE",
  UNKNOWN: null,
} as const satisfies Record<Safe2PayStatus, "PAGA" | "CANCELADA" | "REEMBOLSADA" | "FALHOU" | "PENDENTE" | null>;

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-safe2pay-signature");
  const verification = verifyWebhookSignature(rawBody, sig);
  if (!verification.valid) {
    return NextResponse.json({ erro: "Assinatura inválida", motivo: verification.reason }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const txId = pickString(body, "IdTransaction", "Reference", "id", "transactionId");
  const subId = pickString(body, "IdSubscription", "subscriptionId");
  const statusRaw = pickString(body, "Status", "status") ?? body.Status ?? body.status;

  if (!txId && !subId) {
    return NextResponse.json({ erro: "IdTransaction/IdSubscription ausente" }, { status: 400 });
  }

  const safeStatus = mapSafe2PayStatus(statusRaw);
  const dbStatus = SAFE2PAY_TO_DB[safeStatus];

  if (subId) {
    const assinatura = await prisma.safe2PayAssinatura.findUnique({ where: { safe2payId: subId } });
    if (assinatura) {
      const ativa = safeStatus === "CANCELLED" || safeStatus === "FAILED" ? false : assinatura.ativa;
      await prisma.safe2PayAssinatura.update({
        where: { id: assinatura.id },
        data: {
          ativa,
          canceladaEm: !ativa && !assinatura.canceladaEm ? new Date() : assinatura.canceladaEm,
        },
      });
    }
  }

  if (!txId) {
    return NextResponse.json({ ok: true, scope: "subscription" });
  }

  const doacao = await prisma.doacao.findFirst({ where: { safe2payId: txId } });
  if (doacao) {
    if (!dbStatus) {
      return NextResponse.json({ ok: true, ignored: safeStatus });
    }

    const wasPaid = doacao.status === "PAGA";
    await prisma.doacao.update({
      where: { id: doacao.id },
      data: {
        status: dbStatus,
        pagaEm: dbStatus === "PAGA" && !doacao.pagaEm ? new Date() : doacao.pagaEm,
        safe2payJson: body as Prisma.InputJsonValue,
      },
    });

    if (dbStatus === "PAGA" && !wasPaid) {
      await prisma.lancamentoFinanceiro.create({
        data: {
          igrejaId: doacao.igrejaId,
          tipo: "ENTRADA",
          status: "CONCILIADO",
          formaPagamento: doacao.formaPagamento,
          valor: doacao.valor,
          data: new Date(),
          descricao: `Doação ${doacao.nomeDoador}`,
          doacaoId: doacao.id,
        },
      });

      if (doacao.campanhaId) {
        await prisma.campanha.update({
          where: { id: doacao.campanhaId },
          data: { arrecadado: { increment: doacao.valor } },
        });
      }
    }

    return NextResponse.json({ ok: true, status: dbStatus, scope: "doacao" });
  }

  // fallback: pedido da loja
  const pedido = await prisma.lojaPedido.findFirst({ where: { safe2payId: txId } });
  if (pedido) {
    if (!dbStatus) {
      return NextResponse.json({ ok: true, ignored: safeStatus });
    }
    const novoStatus =
      dbStatus === "PAGA"
        ? "PAGO"
        : dbStatus === "CANCELADA"
          ? "CANCELADO"
          : dbStatus === "REEMBOLSADA"
            ? "REEMBOLSADO"
            : pedido.status;

    await prisma.lojaPedido.update({
      where: { id: pedido.id },
      data: {
        status: novoStatus,
        pagoEm:
          novoStatus === "PAGO" && !pedido.pagoEm ? new Date() : pedido.pagoEm,
      },
    });

    return NextResponse.json({ ok: true, status: novoStatus, scope: "loja" });
  }

  return NextResponse.json({ ok: true, msg: "Recurso não encontrado" });
}

export async function GET() {
  return NextResponse.json({ msg: "Safe2Pay webhook endpoint pronto. POST esperado com header x-safe2pay-signature." });
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0) return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}
