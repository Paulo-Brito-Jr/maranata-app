"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function aprovarComentario(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA");
  await prisma.pregacaoComentario.update({ where: { id }, data: { aprovado: true } });
  revalidatePath("/admin/pregacoes/comentarios");
}

export async function removerComentario(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA");
  await prisma.pregacaoComentario.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/pregacoes/comentarios");
}
