"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

const schema = z.object({
  data: z.string().min(1),
  titulo: z.string().min(2).max(120),
  versiculoRef: z.string().min(1).max(40),
  versiculoTexto: z.string().min(3).max(2000),
  texto: z.string().min(10),
  autor: z.string().max(120).optional(),
  publicado: z.string().optional(),
});

export async function criarDevocional(formData: FormData): Promise<void> {
  await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  const parsed = schema.parse(Object.fromEntries(formData.entries()));

  const dataDia = new Date(parsed.data);
  dataDia.setHours(0, 0, 0, 0);

  await prisma.devocional.upsert({
    where: { data: dataDia },
    create: {
      data: dataDia,
      titulo: parsed.titulo,
      versiculoRef: parsed.versiculoRef,
      versiculoTexto: parsed.versiculoTexto,
      texto: parsed.texto,
      autor: parsed.autor || null,
      publicado: parsed.publicado === "on",
    },
    update: {
      titulo: parsed.titulo,
      versiculoRef: parsed.versiculoRef,
      versiculoTexto: parsed.versiculoTexto,
      texto: parsed.texto,
      autor: parsed.autor || null,
      publicado: parsed.publicado === "on",
    },
  });

  revalidatePath("/admin/devocional");
  revalidatePath("/membro/devocional");
  redirect("/admin/devocional");
}
