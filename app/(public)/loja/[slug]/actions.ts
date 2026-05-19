"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { lerCarrinho, salvarCarrinho } from "@/lib/carrinho";

export async function adicionarAoCarrinho(formData: FormData): Promise<void> {
  const produtoId = String(formData.get("produtoId") || "");
  const quantidade = Math.max(1, Number(formData.get("quantidade") || 1));
  if (!produtoId) return;

  const carrinho = await lerCarrinho();
  const existente = carrinho.find((c) => c.produtoId === produtoId);
  if (existente) existente.quantidade += quantidade;
  else carrinho.push({ produtoId, quantidade });

  await salvarCarrinho(carrinho);
  revalidatePath("/loja/carrinho");
  redirect("/loja/carrinho");
}
