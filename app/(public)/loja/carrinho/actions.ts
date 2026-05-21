"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { lerCarrinho, salvarCarrinho } from "@/lib/carrinho";
import { Prisma } from "@prisma/client";

const FRETE_FIXO = 15;

export async function removerDoCarrinho(produtoId: string): Promise<void> {
  const carrinho = await lerCarrinho();
  const novo = carrinho.filter((i) => i.produtoId !== produtoId);
  await salvarCarrinho(novo);
  revalidatePath("/loja/carrinho");
}

export async function finalizarPedido(formData: FormData): Promise<void> {
  const nome = String(formData.get("nome") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const telefone = String(formData.get("telefone") || "").trim() || null;
  const documento = String(formData.get("documento") || "").trim() || null;
  const endereco = String(formData.get("endereco") || "").trim() || null;
  const cep = String(formData.get("cep") || "").trim() || null;
  const cidadeUf = String(formData.get("cidadeUf") || "").trim() || null;
  if (!nome || !email) return;

  const itens = await lerCarrinho();
  if (itens.length === 0) return;

  const produtos = await prisma.lojaProduto.findMany({
    where: { id: { in: itens.map((i) => i.produtoId) } },
    select: { id: true, preco: true, precoPromocional: true },
  });
  const mapa = new Map(produtos.map((p) => [p.id, p]));

  let subtotal = 0;
  const itensCreate: Prisma.LojaItemPedidoCreateWithoutPedidoInput[] = [];
  for (const i of itens) {
    const p = mapa.get(i.produtoId);
    if (!p) continue;
    const precoUnit = Number(p.precoPromocional ?? p.preco);
    const total = precoUnit * i.quantidade;
    subtotal += total;
    itensCreate.push({
      produto: { connect: { id: i.produtoId } },
      quantidade: i.quantidade,
      precoUnit,
      total,
    });
  }

  if (itensCreate.length === 0) return;

  const frete = FRETE_FIXO;
  const total = subtotal + frete;

  const pedido = await prisma.lojaPedido.create({
    data: {
      nome,
      email,
      telefone,
      documento,
      enderecoJson:
        endereco || cep || cidadeUf
          ? { endereco, cep, cidadeUf }
          : undefined,
      status: "AGUARDANDO_PAGAMENTO",
      subtotal,
      frete,
      total,
      itens: { create: itensCreate },
    },
    select: { id: true, numero: true },
  });

  // Redireciona pro endpoint que cria o checkout Safe2Pay e devolve checkoutUrl
  redirect(`/api/loja/checkout?pedidoId=${pedido.id}`);
}
