"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// =============================================================================
// AÇÕES POR SELEÇÃO (toolbar de checkboxes)
// =============================================================================

export async function publicarLoteAction(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.testemunho.updateMany({
    where: { id: { in: ids } },
    data: { publicado: true },
  });
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
  revalidatePath("/membro/testemunhos");
}

export async function ocultarLoteAction(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.testemunho.updateMany({
    where: { id: { in: ids } },
    data: { publicado: false, destaque: false },
  });
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
  revalidatePath("/membro/testemunhos");
}

export async function excluirLoteAction(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.testemunho.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
}

// =============================================================================
// AÇÕES RÁPIDAS (sem seleção) — operam em filtros globais
// =============================================================================

// Excluir do filtro o placeholder do legado InChurch
const SEM_PLACEHOLDER = {
  NOT: { texto: { startsWith: "Testemunho de " } },
};

function revalidarTudo() {
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
  revalidatePath("/membro/testemunhos");
}

/**
 * Publica todos os testemunhos marcados como DESTAQUE
 * (que ainda não estão publicados).
 */
export async function publicarTodosDestaqueAction(): Promise<{
  atualizados: number;
}> {
  const r = await prisma.testemunho.updateMany({
    where: {
      destaque: true,
      publicado: false,
      ...SEM_PLACEHOLDER,
    },
    data: { publicado: true },
  });
  revalidarTudo();
  return { atualizados: r.count };
}

/**
 * Publica todos os testemunhos criados nos últimos 60 dias
 * (e que ainda não estão publicados).
 */
export async function publicarUltimos60DiasAction(): Promise<{
  atualizados: number;
}> {
  const sessenta = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const r = await prisma.testemunho.updateMany({
    where: {
      publicado: false,
      criadoEm: { gte: sessenta },
      ...SEM_PLACEHOLDER,
    },
    data: { publicado: true },
  });
  revalidarTudo();
  return { atualizados: r.count };
}

/**
 * Publica TODOS os testemunhos pendentes.
 * Ignora os placeholders de legado do InChurch.
 */
export async function publicarTodosAction(): Promise<{
  atualizados: number;
}> {
  const r = await prisma.testemunho.updateMany({
    where: {
      publicado: false,
      ...SEM_PLACEHOLDER,
    },
    data: { publicado: true },
  });
  revalidarTudo();
  return { atualizados: r.count };
}

/**
 * Despublica TODOS os testemunhos publicados (e tira destaque).
 */
export async function despublicarTodosAction(): Promise<{
  atualizados: number;
}> {
  const r = await prisma.testemunho.updateMany({
    where: { publicado: true },
    data: { publicado: false, destaque: false },
  });
  revalidarTudo();
  return { atualizados: r.count };
}
