"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function criarCategoriaEventoAction(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const nome = String(formData.get("nome") || "").trim();
  const cor = String(formData.get("cor") || "").trim() || null;
  const icone = String(formData.get("icone") || "").trim() || null;
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!nome) return;

  await prisma.categoriaEvento.upsert({
    where: { nome },
    update: { cor, icone, igrejaId },
    create: { nome, cor, icone, igrejaId },
  });
  revalidatePath("/admin/eventos/categorias");
  revalidatePath("/admin/eventos");
}

export async function excluirCategoriaEventoAction(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  await prisma.categoriaEvento.delete({ where: { id } });
  revalidatePath("/admin/eventos/categorias");
}
