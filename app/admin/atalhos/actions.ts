"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function criarAtalhoAction(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const titulo = String(formData.get("titulo") || "").trim();
  const linkUrl = String(formData.get("linkUrl") || "").trim();
  const icone = String(formData.get("icone") || "").trim() || null;
  const ordem = Number(formData.get("ordem") || 0);
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!titulo || !linkUrl) return;

  await prisma.atalho.create({
    data: { titulo, linkUrl, icone, ordem, igrejaId },
  });
  revalidatePath("/admin/atalhos");
  revalidatePath("/membro");
}

export async function atualizarAtalhoAction(id: string, formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const titulo = String(formData.get("titulo") || "").trim();
  const linkUrl = String(formData.get("linkUrl") || "").trim();
  const icone = String(formData.get("icone") || "").trim() || null;
  const ordem = Number(formData.get("ordem") || 0);
  const ativo = formData.get("ativo") === "on";
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!titulo || !linkUrl) return;

  await prisma.atalho.update({
    where: { id },
    data: { titulo, linkUrl, icone, ordem, ativo, igrejaId },
  });
  revalidatePath("/admin/atalhos");
  revalidatePath("/membro");
}

export async function toggleAtalhoAction(id: string, ativo: boolean): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  await prisma.atalho.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/atalhos");
  revalidatePath("/membro");
}

export async function excluirAtalhoAction(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  await prisma.atalho.delete({ where: { id } });
  revalidatePath("/admin/atalhos");
  revalidatePath("/membro");
}
