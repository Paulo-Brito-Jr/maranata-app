"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function toggleFlagAction(chave: string, habilitada: boolean) {
  await prisma.featureFlag.upsert({
    where: { chave },
    create: { chave, habilitada },
    update: { habilitada },
  });
  revalidatePath("/admin/config");
}

export async function criarFlagAction(formData: FormData) {
  const chave = String(formData.get("chave") || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_");
  const descricao = String(formData.get("descricao") || "").trim() || null;
  if (!chave) return;
  await prisma.featureFlag.upsert({
    where: { chave },
    create: { chave, descricao, habilitada: false },
    update: { descricao },
  });
  revalidatePath("/admin/config");
}

export async function excluirFlagAction(chave: string) {
  await prisma.featureFlag.delete({ where: { chave } });
  revalidatePath("/admin/config");
}
