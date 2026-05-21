"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function criarPlanoAction(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const capaUrl = String(formData.get("capaUrl") || "").trim() || null;
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!titulo) return;

  await prisma.planoLeitura.create({
    data: { titulo, descricao, capaUrl, igrejaId },
  });
  revalidatePath("/admin/planos-leitura");
}

export async function togglePlanoPublicadoAction(
  id: string,
  publicado: boolean,
): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  await prisma.planoLeitura.update({ where: { id }, data: { publicado } });
  revalidatePath("/admin/planos-leitura");
}

export async function atualizarPlanoAction(id: string, formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const capaUrl = String(formData.get("capaUrl") || "").trim() || null;
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!titulo) return;

  await prisma.planoLeitura.update({
    where: { id },
    data: { titulo, descricao, capaUrl, igrejaId },
  });
  revalidatePath("/admin/planos-leitura");
}

export async function excluirPlanoAction(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  await prisma.planoLeituraInscricao.deleteMany({ where: { planoId: id } });
  await prisma.planoLeitura.delete({ where: { id } });
  revalidatePath("/admin/planos-leitura");
}
