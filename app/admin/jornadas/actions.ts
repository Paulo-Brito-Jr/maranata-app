"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function criarTrilhaAction(formData: FormData) {
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const obrigatoria = formData.get("obrigatoria") === "on";
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!titulo) return;

  const max = await prisma.trilha.aggregate({ _max: { ordem: true } });
  await prisma.trilha.create({
    data: {
      titulo,
      descricao,
      obrigatoria,
      igrejaId,
      ordem: (max._max.ordem ?? 0) + 1,
    },
  });
  revalidatePath("/admin/jornadas");
}

export async function toggleTrilhaAtivaAction(id: string, ativa: boolean) {
  await prisma.trilha.update({ where: { id }, data: { ativa } });
  revalidatePath("/admin/jornadas");
}

export async function excluirTrilhaAction(id: string) {
  await prisma.trilha.delete({ where: { id } });
  revalidatePath("/admin/jornadas");
}

export async function adicionarEtapaAction(formData: FormData) {
  const trilhaId = String(formData.get("trilhaId") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  if (!trilhaId || !titulo) return;

  const max = await prisma.etapaTrilha.aggregate({
    _max: { ordem: true },
    where: { trilhaId },
  });
  await prisma.etapaTrilha.create({
    data: {
      trilhaId,
      titulo,
      descricao,
      ordem: (max._max.ordem ?? 0) + 1,
    },
  });
  revalidatePath("/admin/jornadas");
}
