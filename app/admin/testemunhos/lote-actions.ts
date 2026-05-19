"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function publicarLoteAction(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.testemunho.updateMany({
    where: { id: { in: ids } },
    data: { publicado: true },
  });
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
  revalidatePath("/membro/testemunhos");
}

export async function ocultarLoteAction(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.testemunho.updateMany({
    where: { id: { in: ids } },
    data: { publicado: false, destaque: false },
  });
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
  revalidatePath("/membro/testemunhos");
}

export async function excluirLoteAction(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.testemunho.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
}
