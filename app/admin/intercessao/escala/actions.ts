"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DIA_OK = (d: number) => Number.isInteger(d) && d >= 0 && d <= 6;
const HORA_OK = (h: number) => Number.isInteger(h) && h >= 0 && h <= 23;

export async function adicionarSlotAction(formData: FormData) {
  const diaSemana = Number(formData.get("diaSemana"));
  const hora = Number(formData.get("hora"));
  const intercessorId = String(formData.get("intercessorId") || "").trim();

  if (!intercessorId || !DIA_OK(diaSemana) || !HORA_OK(hora)) return;

  await prisma.escalaIntercessao.upsert({
    where: {
      diaSemana_hora_intercessorId: {
        diaSemana,
        hora,
        intercessorId,
      },
    },
    create: { diaSemana, hora, intercessorId, ativo: true },
    update: { ativo: true },
  });

  revalidatePath("/admin/intercessao/escala");
  revalidatePath("/admin/intercessao");
}

export async function removerSlotAction(id: string) {
  await prisma.escalaIntercessao.delete({ where: { id } });
  revalidatePath("/admin/intercessao/escala");
  revalidatePath("/admin/intercessao");
}

export async function toggleSlotAtivoAction(id: string, ativo: boolean) {
  await prisma.escalaIntercessao.update({
    where: { id },
    data: { ativo },
  });
  revalidatePath("/admin/intercessao/escala");
  revalidatePath("/admin/intercessao");
}

export async function removerIntercessorAction(intercessorId: string) {
  if (!intercessorId) return;
  await prisma.escalaIntercessao.deleteMany({ where: { intercessorId } });
  revalidatePath("/admin/intercessao/escala");
  revalidatePath("/admin/intercessao");
}
