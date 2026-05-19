"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function publicarTestemunhoAction(id: string) {
  await prisma.testemunho.update({
    where: { id },
    data: { publicado: true },
  });
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
  revalidatePath("/membro/testemunhos");
}

export async function ocultarTestemunhoAction(id: string) {
  await prisma.testemunho.update({
    where: { id },
    data: { publicado: false, destaque: false },
  });
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
  revalidatePath("/membro/testemunhos");
}

export async function toggleDestaqueAction(id: string, destaque: boolean) {
  await prisma.testemunho.update({
    where: { id },
    data: { destaque, publicado: destaque ? true : undefined },
  });
  revalidatePath("/admin/testemunhos");
  revalidatePath("/testemunhos");
  revalidatePath("/membro/testemunhos");
}

export async function excluirTestemunhoAction(id: string) {
  await prisma.testemunho.delete({ where: { id } });
  revalidatePath("/admin/testemunhos");
}
