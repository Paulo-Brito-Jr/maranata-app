import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCheckout, Safe2PayError, getAppUrl } from "@/lib/safe2pay";

/**
 * Endpoint que cria o checkout Safe2Pay pro pedido e redireciona pra checkoutUrl.
 *
 * Aceita GET (via redirect do server action) e POST (via form direto).
 * Query/form param: `pedidoId`.
 */
async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let pedidoId = url.searchParams.get("pedidoId");

  if (!pedidoId && req.method === "POST") {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => null);
      pedidoId = body?.pedidoId ?? null;
    } else {
      const form = await req.formData().catch(() => null);
      pedidoId = form?.get("pedidoId")?.toString() ?? null;
    }
  }

  if (!pedidoId) {
    return NextResponse.redirect(new URL("/loja/carrinho?err=pedido", url.origin));
  }

  const pedido = await prisma.lojaPedido.findUnique({
    where: { id: pedidoId },
    select: {
      id: true,
      numero: true,
      nome: true,
      email: true,
      telefone: true,
      documento: true,
      status: true,
      total: true,
      safe2payId: true,
    },
  });

  if (!pedido) {
    return NextResponse.redirect(new URL("/loja/carrinho?err=pedido", url.origin));
  }

  if (pedido.status === "PAGO") {
    return NextResponse.redirect(new URL(`/loja/pedido/${pedido.id}`, url.origin));
  }

  const appUrl = getAppUrl();
  const callbackUrl = `${appUrl}/loja/pedido/${pedido.id}`;
  const webhookUrl = `${appUrl}/api/webhooks/safe2pay`;

  try {
    const checkout = await createCheckout({
      reference: `loja_${pedido.id}`,
      amount: Number(pedido.total),
      description: `Pedido #${pedido.numero} — Loja Maranata`,
      callbackUrl,
      webhookUrl,
      customer: {
        name: pedido.nome,
        email: pedido.email,
        phone: pedido.telefone ?? undefined,
        document: pedido.documento ?? undefined,
      },
      paymentMethods: ["PIX", "CREDIT_CARD"],
    });

    await prisma.lojaPedido.update({
      where: { id: pedido.id },
      data: { safe2payId: checkout.transactionId },
    });

    return NextResponse.redirect(checkout.checkoutUrl);
  } catch (err) {
    const code =
      err instanceof Safe2PayError ? `safe2pay_${err.status || "fail"}` : "checkout";
    return NextResponse.redirect(
      new URL(`/loja/pedido/${pedido.id}?err=${code}`, url.origin),
    );
  }
}

export async function GET(req: Request): Promise<Response> {
  return handle(req);
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}
