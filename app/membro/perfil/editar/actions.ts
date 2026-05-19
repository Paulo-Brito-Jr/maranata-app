"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  fotoUrl: z.string().url().or(z.literal("")).optional(),
  telefone: z.string().max(40).optional(),
  profissao: z.string().max(120).optional(),
  endereco: z.string().max(200).optional(),
  cidade: z.string().max(80).optional(),
  estado: z.string().max(40).optional(),
  cep: z.string().max(20).optional(),
  observacoes: z.string().max(2000).optional(),
});

function vazioPraNull(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length === 0 ? null : t;
}

export async function atualizarMeuPerfil(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redir=/membro/perfil/editar");
  }

  const parsed = schema.parse(Object.fromEntries(formData.entries()));

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!membro) {
    throw new Error("Membro não encontrado pra este e-mail");
  }

  await prisma.membro.update({
    where: { id: membro.id },
    data: {
      fotoUrl: vazioPraNull(parsed.fotoUrl),
      telefone: vazioPraNull(parsed.telefone),
      profissao: vazioPraNull(parsed.profissao),
      endereco: vazioPraNull(parsed.endereco),
      cidade: vazioPraNull(parsed.cidade),
      estado: vazioPraNull(parsed.estado),
      cep: vazioPraNull(parsed.cep),
      observacoes: vazioPraNull(parsed.observacoes),
    },
  });

  revalidatePath("/membro/perfil");
  redirect("/membro/perfil");
}
