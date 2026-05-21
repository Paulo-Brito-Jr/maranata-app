"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { StatusMembro, EstadoCivil, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

async function resolveUserId(): Promise<string | null> {
  const u = await getCurrentUser();
  if (!u?.sub) return null;
  const usuario = await prisma.usuario.findUnique({
    where: { maranataKeySub: u.sub },
    select: { id: true },
  });
  return usuario?.id ?? null;
}

type DiffEntry = { campo: string; antes: unknown; depois: unknown };

function diffMembro(antes: Record<string, unknown>, depois: Record<string, unknown>): DiffEntry[] {
  const campos = [
    "igrejaId", "nome", "email", "telefone", "cpf", "profissao",
    "estadoCivil", "dataNascimento", "dataBatismo", "dataConversao",
    "status", "endereco", "cidade", "observacoes",
  ];
  const out: DiffEntry[] = [];
  for (const k of campos) {
    const a = antes[k] instanceof Date ? (antes[k] as Date).toISOString() : antes[k];
    const d = depois[k] instanceof Date ? (depois[k] as Date).toISOString() : depois[k];
    if (a !== d) out.push({ campo: k, antes: a ?? null, depois: d ?? null });
  }
  return out;
}

function tipoEvento(diff: DiffEntry[]): string {
  if (diff.find((d) => d.campo === "igrejaId")) return "mudanca_igreja";
  if (diff.find((d) => d.campo === "status")) {
    const s = diff.find((d) => d.campo === "status")!;
    return `mudanca_status_${String(s.depois).toLowerCase()}`;
  }
  if (diff.find((d) => d.campo === "dataBatismo" && d.antes == null && d.depois != null)) return "batismo";
  if (diff.find((d) => d.campo === "dataConversao" && d.antes == null && d.depois != null)) return "conversao";
  return "atualizacao";
}

const MembroInput = z.object({
  igrejaId: z.string().min(1, "Selecione a igreja"),
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  dataNascimento: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  profissao: z.string().optional().or(z.literal("")),
  estadoCivil: z.nativeEnum(EstadoCivil).optional().or(z.literal("")),
  dataBatismo: z.string().optional().or(z.literal("")),
  dataConversao: z.string().optional().or(z.literal("")),
  status: z.nativeEnum(StatusMembro).default(StatusMembro.ATIVO),
  endereco: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

function clean<T extends Record<string, unknown>>(input: T) {
  const out = { ...input } as Record<string, unknown>;
  for (const k of Object.keys(out)) {
    if (out[k] === "" || out[k] === undefined) out[k] = null;
  }
  return out;
}

export async function criarMembro(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = MembroInput.parse(raw);
  const c = clean(data);
  const usuarioId = await resolveUserId();

  const membro = await prisma.membro.create({
    data: {
      igrejaId: c.igrejaId as string,
      nome: c.nome as string,
      email: (c.email as string) ?? null,
      telefone: (c.telefone as string) ?? null,
      cpf: (c.cpf as string) ?? null,
      profissao: (c.profissao as string) ?? null,
      estadoCivil: (c.estadoCivil as EstadoCivil) ?? null,
      dataNascimento: c.dataNascimento ? new Date(c.dataNascimento as string) : null,
      dataBatismo: c.dataBatismo ? new Date(c.dataBatismo as string) : null,
      dataConversao: c.dataConversao ? new Date(c.dataConversao as string) : null,
      status: (c.status as StatusMembro) ?? StatusMembro.ATIVO,
      endereco: (c.endereco as string) ?? null,
      cidade: (c.cidade as string) ?? null,
      observacoes: (c.observacoes as string) ?? null,
    },
  });

  await prisma.historicoMembro.create({
    data: {
      membroId: membro.id,
      tipo: "cadastro_inicial",
      diffJson: { criado: c } as Prisma.InputJsonValue,
      registradoPorId: usuarioId,
    },
  });

  revalidatePath("/admin/membros");
  redirect(`/admin/membros/${membro.id}`);
}

export async function atualizarMembro(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = MembroInput.parse(raw);
  const c = clean(data);
  const usuarioId = await resolveUserId();

  const antes = await prisma.membro.findUnique({ where: { id } });
  if (!antes) throw new Error("Membro não encontrado");

  const depois = {
    igrejaId: c.igrejaId as string,
    nome: c.nome as string,
    email: (c.email as string) ?? null,
    telefone: (c.telefone as string) ?? null,
    cpf: (c.cpf as string) ?? null,
    profissao: (c.profissao as string) ?? null,
    estadoCivil: (c.estadoCivil as EstadoCivil) ?? null,
    dataNascimento: c.dataNascimento ? new Date(c.dataNascimento as string) : null,
    dataBatismo: c.dataBatismo ? new Date(c.dataBatismo as string) : null,
    dataConversao: c.dataConversao ? new Date(c.dataConversao as string) : null,
    status: (c.status as StatusMembro) ?? StatusMembro.ATIVO,
    endereco: (c.endereco as string) ?? null,
    cidade: (c.cidade as string) ?? null,
    observacoes: (c.observacoes as string) ?? null,
  };

  await prisma.membro.update({ where: { id }, data: depois });

  const diff = diffMembro(antes as unknown as Record<string, unknown>, depois);
  if (diff.length > 0) {
    await prisma.historicoMembro.create({
      data: {
        membroId: id,
        tipo: tipoEvento(diff),
        diffJson: { mudancas: diff } as Prisma.InputJsonValue,
        registradoPorId: usuarioId,
      },
    });
  }

  revalidatePath("/admin/membros");
  revalidatePath(`/admin/membros/${id}`);
  redirect(`/admin/membros/${id}`);
}

export async function deletarMembro(id: string) {
  const usuarioId = await resolveUserId();
  const antes = await prisma.membro.findUnique({ where: { id } });
  if (antes) {
    await prisma.historicoMembro.create({
      data: {
        membroId: id,
        tipo: "exclusao",
        diffJson: { snapshot: antes } as unknown as Prisma.InputJsonValue,
        registradoPorId: usuarioId,
      },
    });
  }
  await prisma.membro.delete({ where: { id } });
  revalidatePath("/admin/membros");
  redirect("/admin/membros");
}
