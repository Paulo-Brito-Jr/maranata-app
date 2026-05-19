"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function marcarPresencaManual(id: string): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA");
  const i = await prisma.inscricaoEvento.findUnique({
    where: { id },
    select: { checkInEm: true, eventoId: true },
  });
  if (!i) return;
  await prisma.inscricaoEvento.update({
    where: { id },
    data: {
      checkInEm: i.checkInEm ? null : new Date(),
      status: i.checkInEm ? "PENDENTE" : "CONFIRMADA",
    },
  });
  revalidatePath(`/admin/eventos/${i.eventoId}/checkin/manual`);
  revalidatePath(`/admin/eventos/${i.eventoId}/checkin`);
}
