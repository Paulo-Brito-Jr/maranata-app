"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { StatusOracao } from "@prisma/client";

export async function atualizarStatusPedido(id: string, status: StatusOracao) {
  await prisma.pedidoOracao.update({ where: { id }, data: { status } });
  revalidatePath("/admin/intercessao");
}

export async function publicarTestemunho(id: string, publicado: boolean) {
  await prisma.testemunho.update({ where: { id }, data: { publicado } });
  revalidatePath("/admin/intercessao");
}

export async function criarPedido(formData: FormData) {
  const pedido = String(formData.get("pedido") || "").trim();
  const nome = String(formData.get("nome") || "").trim();
  if (!pedido) return;
  await prisma.pedidoOracao.create({
    data: { pedido, nomeAvulso: nome || null },
  });
  revalidatePath("/admin/intercessao");
}
