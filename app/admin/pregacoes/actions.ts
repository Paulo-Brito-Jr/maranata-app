"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/push";

export async function criarPregacao(formData: FormData) {
  const titulo = String(formData.get("titulo") || "").trim();
  const pregador = String(formData.get("pregador") || "").trim() || null;
  const data = String(formData.get("data") || "");
  const youtubeId = String(formData.get("youtubeId") || "").trim() || null;
  const categoriaId = String(formData.get("categoriaId") || "").trim() || null;
  const descricao = String(formData.get("descricao") || "").trim() || null;
  const igrejaIdRaw = String(formData.get("igrejaId") || "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;

  if (!titulo) return;

  await prisma.pregacao.create({
    data: {
      titulo,
      pregador,
      data: data ? new Date(data) : null,
      youtubeId,
      categoriaId,
      descricao,
      igrejaId,
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

  const push = await prisma.pushNotification.create({
    data: {
      titulo,
      corpo,
      alvo,
    },
  });
  const resultado = await enviarPush({ tipo: "TODOS" }, { titulo, corpo, url: "/membro" });
  await prisma.pushNotification.update({
    where: { id: push.id },
    data: { enviadoEm: new Date(), totalEnviado: resultado.enviados },
  });
  revalidatePath("/admin/push");
}
