"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function criarTurma(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const disciplinaId = String(formData.get("disciplinaId") || "");
  const semestre = String(formData.get("semestre") || "").trim();
  const professorId = String(formData.get("professorId") || "").trim() || null;
  const diaSemana = Number(formData.get("diaSemana") || 0);
  const horario = String(formData.get("horario") || "").trim();
  const sala = String(formData.get("sala") || "").trim() || null;
  const vagas = Number(formData.get("vagas") || 40);
  if (!disciplinaId || !semestre || !horario) return;

  const t = await prisma.ibmTurma.create({
    data: { disciplinaId, semestre, professorId, diaSemana, horario, sala, vagas },
  });
  revalidatePath(`/admin/escola/ibm/disciplinas/${disciplinaId}`);
  redirect(`/admin/escola/ibm/turmas/${t.id}`);
}
