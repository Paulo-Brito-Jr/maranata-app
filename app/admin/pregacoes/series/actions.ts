"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function criarSerieAction(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const titulo = String(formData.get("titulo") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const capaUrl = String(formData.get("capaUrl") || "").trim() || null;
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!titulo) return;

  await prisma.seriePregacao.create({
    data: { titulo, descricao, capaUrl, igrejaId },
  });
  revalidatePath("/admin/pregacoes/series");
}

export async function excluirSerieAction(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  await prisma.seriePregacao.delete({ where: { id } });
  revalidatePath("/admin/pregacoes/series");
}
