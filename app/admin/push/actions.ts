"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { enviarPush, type PushAlvo } from "@/lib/push";
import { PushAlvo as PrismaPushAlvo, type MinisterioGeral } from "@prisma/client";

const MINISTERIOS_VALIDOS = [
  "KIDS",
  "TEEN",
  "JOVENS",
  "CASAIS",
  "TERCEIRA_IDADE",
  "LOUVOR",
] as const;

function lerArrayDeFormData(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);
}

export async function enviarPushAgoraAction(id: string) {
  const push = await prisma.pushNotification.findUnique({ where: { id } });
  if (!push) return;

  // Combina single (legado) + arrays (novo). Arrays vencem se tiverem itens.
  const igrejaIds = push.igrejasIds.length > 0
    ? push.igrejasIds
    : push.igrejaId
    ? [push.igrejaId]
    : [];
  const regionalIds = push.regionaisIds.length > 0
    ? push.regionaisIds
    : push.regionalId
    ? [push.regionalId]
    : [];
  const ministerios: MinisterioGeral[] =
    push.ministerios.length > 0
      ? push.ministerios
      : push.ministerio
      ? [push.ministerio]
      : [];

  const temSegmentacao =
    igrejaIds.length > 0 || regionalIds.length > 0 || ministerios.length > 0;

  const alvo: PushAlvo = temSegmentacao
    ? { tipo: "SEGMENTADO", igrejaIds, regionalIds, ministerios }
    : { tipo: "TODOS" };

  const resultado = await enviarPush(alvo, {
    titulo: push.titulo,
    corpo: push.corpo,
    url: push.url ?? undefined,
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

export async function criarPushSegmentadoAction(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim() || null;
  const enviarAgora = formData.get("enviarAgora") === "on";
  if (!titulo || !corpo) return;

  const igrejasIds = lerArrayDeFormData(formData, "igrejasIds");
  const regionaisIds = lerArrayDeFormData(formData, "regionaisIds");
  const ministerios = lerArrayDeFormData(formData, "ministerios").filter(
    (m): m is MinisterioGeral => (MINISTERIOS_VALIDOS as readonly string[]).includes(m),
  );

  const push = await prisma.pushNotification.create({
    data: {
      titulo,
      corpo,
      url,
      igrejasIds,
      regionaisIds,
      ministerios,
      alvo:
        igrejasIds.length > 0
          ? PrismaPushAlvo.IGREJA
          : regionaisIds.length > 0 || ministerios.length > 0
          ? PrismaPushAlvo.CUSTOM
          : PrismaPushAlvo.TODOS,
    },
  });

  if (enviarAgora) {
    await enviarPushAgoraAction(push.id);
  }

  revalidatePath("/admin/push");
}

// mantido por compat (botão "enviar simples" no composer atual)
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
