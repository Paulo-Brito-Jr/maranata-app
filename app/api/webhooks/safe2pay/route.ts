import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook Safe2Pay — entra status do pagamento.
 * Doc: https://safe2pay.com.br/docs/webhooks
 *
 * Por ora aceita o JSON e atualiza a doação correspondente. Em F2.1 vamos
 * adicionar verificação HMAC com SAFE2PAY_WEBHOOK_SECRET e mapear todos os
 * status reais (Authorized, Paid, Cancelled, Refunded, etc).
 */
export async function POST(req: Request) {
  const secret = process.env.SAFE2PAY_WEBHOOK_SECRET;
  const sig = req.headers.get("x-safe2pay-signature");

  // F2.1 — TODO: validar HMAC
  if (secret && !sig) {
    return NextResponse.json({ erro: "Sem assinatura" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const txId: string | undefined = body?.IdTransaction ?? body?.Reference ?? body?.id;
  const statusSafe2Pay: string | undefined = body?.Status ?? body?.status;

  if (!txId) {
    return NextResponse.json({ erro: "IdTransaction ausente" }, { status: 400 });
  }

  const doacao = await prisma.doacao.findFirst({
    where: { safe2payId: txId },
  });

  if (!doacao) {
    return NextResponse.json({ ok: true, msg: "Doação não encontrada" });
  }

  const status =
    statusSafe2Pay === "Paid" || statusSafe2Pay === "3"
      ? "PAGA"
      : statusSafe2Pay === "Cancelled" || statusSafe2Pay === "5"
        ? "CANCELADA"
        : statusSafe2Pay === "Refunded" || statusSafe2Pay === "6"
          ? "REEMBOLSADA"
          : doacao.status;

  await prisma.doacao.update({
    where: { id: doacao.id },
    data: {
      status,
      pagaEm: status === "PAGA" ? new Date() : doacao.pagaEm,
      safe2payJson: body,
    },
  });

  // Cria lançamento financeiro automático se foi paga
  if (status === "PAGA" && !doacao.pagaEm) {
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

    // Atualiza arrecadado da campanha
    if (doacao.campanhaId) {
      await prisma.campanha.update({
        where: { id: doacao.campanhaId },
        data: { arrecadado: { increment: doacao.valor } },
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ msg: "Safe2Pay webhook endpoint pronto. POST esperado." });
}
