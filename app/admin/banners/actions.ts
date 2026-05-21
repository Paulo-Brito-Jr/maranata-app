"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function dateOrNull(v: FormDataEntryValue | null): Date | null {
  if (!v || typeof v !== "string" || v.length === 0) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function criarBannerAction(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return;
  const subtitulo = String(formData.get("subtitulo") ?? "").trim() || null;
  const imagemUrl = String(formData.get("imagemUrl") ?? "").trim() || null;
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null;
  const ordem = Number(formData.get("ordem") ?? 0) || 0;
  const igrejaIdRaw = String(formData.get("igrejaId") ?? "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;

  await prisma.banner.create({
    data: {
      titulo,
      subtitulo,
      imagemUrl,
      linkUrl,
      ordem,
      igrejaId,
      inicio: dateOrNull(formData.get("inicio")),
      fim: dateOrNull(formData.get("fim")),
      ativo: true,
    },
  });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function toggleBannerAction(id: string, ativo: boolean) {
  await prisma.banner.update({ where: { id }, data: { ativo } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function atualizarBannerAction(id: string, formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return;
  const subtitulo = String(formData.get("subtitulo") ?? "").trim() || null;
  const imagemUrl = String(formData.get("imagemUrl") ?? "").trim() || null;
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null;
  const ordem = Number(formData.get("ordem") ?? 0) || 0;
  const igrejaIdRaw = String(formData.get("igrejaId") ?? "").trim();
  const igrejaId = igrejaIdRaw && igrejaIdRaw !== "GERAL" ? igrejaIdRaw : null;

  await prisma.banner.update({
    where: { id },
    data: {
      titulo,
      subtitulo,
      imagemUrl,
      linkUrl,
      ordem,
      igrejaId,
      inicio: dateOrNull(formData.get("inicio")),
      fim: dateOrNull(formData.get("fim")),
    },
  });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deletarBannerAction(id: string) {
  await prisma.banner.delete({ where: { id } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}
