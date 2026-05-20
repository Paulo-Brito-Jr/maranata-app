"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Registra o download e redireciona pra URL do arquivo.
 * Server action chamada via form (`action={registrarDownload}`).
 */
export async function registrarDownload(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const download = await prisma.download.findUnique({
    where: { id },
    select: { arquivoUrl: true },
  });
  if (!download) return;
  // increment é fire-and-forget — não bloqueia o redirect
  try {
    await prisma.download.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });
  } catch {
    /* ignore */
  }
  redirect(download.arquivoUrl);
}
