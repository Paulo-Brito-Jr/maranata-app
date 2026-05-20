"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { StatusOracao } from "@prisma/client";

const SLA_HORAS = 48;

function slaDeAgora() {
  return new Date(Date.now() + SLA_HORAS * 60 * 60 * 1000);
}

export async function atualizarStatusPedido(id: string, status: StatusOracao) {
  await prisma.pedidoOracao.update({ where: { id }, data: { status } });
  revalidatePath("/admin/intercessao");
  revalidatePath("/membro/oracao");
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

export async function responderPedido(id: string, formData: FormData) {
  const texto = String(formData.get("resposta") || "").trim();
  if (texto.length < 3) return;

  await prisma.$transaction([
    prisma.respostaOracao.create({
      data: {
        pedidoId: id,
        texto,
      },
    }),
    prisma.pedidoOracao.update({
      where: { id },
      data: { status: StatusOracao.RESPONDIDO },
    }),
  ]);

  revalidatePath("/admin/intercessao");
  revalidatePath("/membro/oracao");
}

/**
 * Atribui um intercessor a uma lista de pedidos.
 * Marca prazoSla = NOW() + 48h, status = EM_ORACAO.
 */
export async function atribuirIntercessor(
  pedidoIds: string[],
  intercessorId: string,
): Promise<{ atualizados: number }> {
  if (!intercessorId || pedidoIds.length === 0) return { atualizados: 0 };
  const result = await prisma.pedidoOracao.updateMany({
    where: { id: { in: pedidoIds } },
    data: {
      intercessorId,
      status: StatusOracao.EM_ORACAO,
      prazoSla: slaDeAgora(),
    },
  });
  revalidatePath("/admin/intercessao");
  revalidatePath("/membro/oracao");
  return { atualizados: result.count };
}

/**
 * Atribuição via FormData (form action no admin).
 */
export async function atribuirIntercessorForm(formData: FormData) {
  const intercessorId = String(formData.get("intercessorId") || "").trim();
  const idsRaw = String(formData.get("pedidoIds") || "");
  const ids = idsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!intercessorId || ids.length === 0) return;
  await atribuirIntercessor(ids, intercessorId);
}

/**
 * Round-robin: distribui pedidos ABERTO sem intercessor
 * entre os EscalaIntercessao ATIVOS.
 *
 * Marca prazoSla = NOW() + 48h, status = EM_ORACAO.
 */
export async function runRoundRobin(): Promise<{
  atribuidos: number;
  intercessores: number;
  pendentes: number;
}> {
  const [escala, pendentes] = await Promise.all([
    prisma.escalaIntercessao.findMany({
      where: { ativo: true },
      select: { intercessorId: true },
    }),
    prisma.pedidoOracao.findMany({
      where: { status: StatusOracao.ABERTO, intercessorId: null },
      select: { id: true },
      orderBy: { criadoEm: "asc" },
    }),
  ]);

  const intercessores = Array.from(
    new Set(escala.map((e) => e.intercessorId)),
  ).filter(Boolean);

  if (intercessores.length === 0 || pendentes.length === 0) {
    return {
      atribuidos: 0,
      intercessores: intercessores.length,
      pendentes: pendentes.length,
    };
  }

  // Distribui round-robin
  const buckets = new Map<string, string[]>();
  for (let i = 0; i < pendentes.length; i++) {
    const intercessor = intercessores[i % intercessores.length];
    if (!buckets.has(intercessor)) buckets.set(intercessor, []);
    buckets.get(intercessor)!.push(pendentes[i].id);
  }

  let atribuidos = 0;
  for (const [intercessorId, ids] of buckets.entries()) {
    const r = await prisma.pedidoOracao.updateMany({
      where: { id: { in: ids } },
      data: {
        intercessorId,
        status: StatusOracao.EM_ORACAO,
        prazoSla: slaDeAgora(),
      },
    });
    atribuidos += r.count;
  }

  revalidatePath("/admin/intercessao");
  revalidatePath("/admin/intercessao/escala");
  revalidatePath("/membro/oracao");

  return {
    atribuidos,
    intercessores: intercessores.length,
    pendentes: pendentes.length,
  };
}

/**
 * Wrapper sem retorno pra usar como form action.
 */
export async function runRoundRobinAction() {
  await runRoundRobin();
}
