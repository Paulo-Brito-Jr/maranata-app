"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PushAlvo as PrismaPushAlvo } from "@prisma/client";

export async function criarTemplate(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const nome = String(formData.get("nome") || "").trim();
  const titulo = String(formData.get("titulo") || "").trim();
  const corpo = String(formData.get("corpo") || "").trim();
  const url = String(formData.get("url") || "").trim() || null;
  const alvoStr = String(formData.get("alvoPadrao") || "TODOS");

  if (!nome || !titulo || !corpo) return;
  const alvo = (Object.values(PrismaPushAlvo) as string[]).includes(alvoStr)
    ? (alvoStr as PrismaPushAlvo)
    : PrismaPushAlvo.TODOS;

  await prisma.pushTemplate.create({
    data: { nome, titulo, corpo, url, alvoPadrao: alvo },
  });
  revalidatePath("/admin/push/templates");
  revalidatePath("/admin/push");
}

export async function removerTemplate(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  await prisma.pushTemplate.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/push/templates");
  revalidatePath("/admin/push");
}
