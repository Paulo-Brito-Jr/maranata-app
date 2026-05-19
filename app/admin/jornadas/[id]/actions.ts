"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function removerEtapaAction(etapaId: string, trilhaId: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  await prisma.etapaTrilha.delete({ where: { id: etapaId } }).catch(() => null);
  revalidatePath(`/admin/jornadas/${trilhaId}`);
}
