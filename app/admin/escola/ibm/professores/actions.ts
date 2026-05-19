"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function criarProfessor(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const nome = String(formData.get("nome") || "").trim();
  const membroId = String(formData.get("membroId") || "").trim() || null;
  const titulacao = String(formData.get("titulacao") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  if (!nome) return;
  await prisma.ibmProfessor.create({
    data: { nome, membroId, titulacao, bio },
  });
  revalidatePath("/admin/escola/ibm/professores");
}
