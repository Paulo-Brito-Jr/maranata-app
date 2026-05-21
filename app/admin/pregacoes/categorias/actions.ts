"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function criarCategoriaPregacaoAction(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const nome = String(formData.get("nome") || "").trim();
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;
  if (!nome) return;

  await prisma.categoriaPregacao.upsert({
    where: { nome },
    update: { igrejaId },
    create: { nome, igrejaId },
  });
  revalidatePath("/admin/pregacoes/categorias");
  revalidatePath("/admin/pregacoes");
}

export async function excluirCategoriaPregacaoAction(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA");
  await prisma.categoriaPregacao.delete({ where: { id } });
  revalidatePath("/admin/pregacoes/categorias");
}
