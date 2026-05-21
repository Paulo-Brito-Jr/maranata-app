"use server";

import { prisma } from "@/lib/prisma";

/**
 * Registra click em banner. Fire & forget — não bloqueia navegação.
 */
export async function registrarClickBanner(id: string): Promise<void> {
  if (!id) return;
  try {
    await prisma.banner.update({
      where: { id },
      data: { cliques: { increment: 1 } },
    });
  } catch {
    /* banner pode ter sido removido — não bloqueia o click */
  }
}
