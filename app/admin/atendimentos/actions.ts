"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const TIPOS = ["visita", "ligacao", "oracao", "aconselhamento", "outro"] as const;

const AtendimentoInput = z.object({
  membroId: z.string().min(1, "Selecione o membro"),
  pastorId: z.string().min(1, "Selecione o pastor"),
  tipo: z.enum(TIPOS),
  resumo: z.string().min(2, "Resumo muito curto"),
  detalhes: z.string().optional().or(z.literal("")),
  proximaAcao: z.string().optional().or(z.literal("")),
  realizadoEm: z.string().optional().or(z.literal("")),
});

export async function criarAtendimentoAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = AtendimentoInput.parse(raw);

  await prisma.atendimentoPastoral.create({
    data: {
      membroId: data.membroId,
      pastorId: data.pastorId,
      tipo: data.tipo,
      resumo: data.resumo,
      detalhes: data.detalhes || null,
      proximaAcao: data.proximaAcao || null,
      realizadoEm: data.realizadoEm ? new Date(data.realizadoEm) : new Date(),
    },
  });

  revalidatePath("/admin/atendimentos");
}

export async function excluirAtendimentoAction(id: string) {
  await prisma.atendimentoPastoral.delete({ where: { id } });
  revalidatePath("/admin/atendimentos");
}
