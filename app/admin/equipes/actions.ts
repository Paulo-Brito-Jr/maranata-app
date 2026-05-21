"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function criarEquipeAction(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const nome = String(formData.get("nome") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!nome) return;

  await prisma.equipe.create({
    data: { nome, descricao, igrejaId },
  });
  revalidatePath("/admin/equipes");
}

export async function toggleEquipeAtivaAction(id: string, ativa: boolean): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  await prisma.equipe.update({ where: { id }, data: { ativa } });
  revalidatePath("/admin/equipes");
}

export async function atualizarEquipeAction(id: string, formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const nome = String(formData.get("nome") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const ativa = formData.get("ativa") === "on";
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!nome) return;

  await prisma.equipe.update({
    where: { id },
    data: { nome, descricao, ativa, igrejaId },
  });
  revalidatePath("/admin/equipes");
}

export async function excluirEquipeAction(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  await prisma.equipe.delete({ where: { id } });
  revalidatePath("/admin/equipes");
}
