"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function criarPregacao(formData: FormData) {
  const titulo = String(formData.get("titulo") || "").trim();
  const pregador = String(formData.get("pregador") || "").trim() || null;
  const data = String(formData.get("data") || "");
  const youtubeId = String(formData.get("youtubeId") || "").trim() || null;
  const categoriaId = String(formData.get("categoriaId") || "").trim() || null;
  const descricao = String(formData.get("descricao") || "").trim() || null;

  if (!titulo) return;

  const p = await prisma.pregacao.create({
    data: {
      titulo,
      pregador,
      data: data ? new Date(data) : null,
      youtubeId,
      categoriaId,
      descricao,
    },
  });
  revalidatePath("/admin/pregacoes");
  redirect(`/admin/pregacoes`);
}

export async function criarPush(formData: FormData) {
  const titulo = String(formData.get("titulo") || "").trim();
  const corpo = String(formData.get("corpo") || "").trim();
  const alvo = String(formData.get("alvo") || "TODOS") as
    | "TODOS"
    | "MEMBROS"
    | "USUARIOS_APP";

  if (!titulo || !corpo) return;

  await prisma.pushNotification.create({
    data: {
      titulo,
      corpo,
      alvo,
    },
  });
  revalidatePath("/admin/push");
}
