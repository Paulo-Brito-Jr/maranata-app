"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { enviarPush, type PushAlvo } from "@/lib/push";
import { PushAlvo as PrismaPushAlvo } from "@prisma/client";

export async function enviarPushAgoraAction(id: string) {
  const push = await prisma.pushNotification.findUnique({ where: { id } });
  if (!push) return;

  let alvo: PushAlvo;
  switch (push.alvo) {
    case "IGREJA":
      if (!push.igrejaId) return;
      alvo = { tipo: "IGREJA", igrejaId: push.igrejaId };
      break;
    case "TODOS":
    case "MEMBROS":
    case "USUARIOS_APP":
    case "CELULA":
    case "CUSTOM":
    default:
      alvo = { tipo: "TODOS" };
      break;
  }

  const resultado = await enviarPush(alvo, {
    titulo: push.titulo,
    corpo: push.corpo,
  });

  await prisma.pushNotification.update({
    where: { id },
    data: {
      enviadoEm: new Date(),
      totalEnviado: resultado.enviados,
    },
  });

  revalidatePath("/admin/push");
}

export async function excluirPushAction(id: string) {
  await prisma.pushNotification.delete({ where: { id } });
  revalidatePath("/admin/push");
}

export async function criarPushDireto(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  const alvoStr = String(formData.get("alvo") ?? "TODOS");
  if (!titulo || !corpo) return;

  const alvoEnum = (Object.values(PrismaPushAlvo) as string[]).includes(alvoStr)
    ? (alvoStr as PrismaPushAlvo)
    : PrismaPushAlvo.TODOS;

  await prisma.pushNotification.create({
    data: { titulo, corpo, alvo: alvoEnum },
  });
  revalidatePath("/admin/push");
}
