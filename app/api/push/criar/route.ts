import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { enviarPush, type PushAlvo as AlvoEnvio } from "@/lib/push";
import { PushAlvo as PrismaPushAlvo } from "@prisma/client";

const schema = z.object({
  titulo: z.string().min(2).max(140),
  corpo: z.string().min(2).max(500),
  url: z.string().max(500).optional(),
  alvo: z.enum(["TODOS", "MEMBROS", "USUARIOS_APP", "IGREJA", "CELULA", "CUSTOM"]),
  igrejaId: z.string().optional(),
  filtroJson: z.record(z.string(), z.unknown()).optional(),
  agendadoPara: z.string().optional(),
  enviarAgora: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA");
  } catch {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ erro: "Payload inválido" }, { status: 400 });
  }

  const d = parsed.data;
  const agendadoPara = d.agendadoPara ? new Date(d.agendadoPara) : null;
  const enviarImediato = d.enviarAgora && !agendadoPara;

  const push = await prisma.pushNotification.create({
    data: {
      titulo: d.titulo,
      corpo: d.corpo,
      url: d.url ?? null,
      alvo: d.alvo as PrismaPushAlvo,
      igrejaId: d.alvo === "IGREJA" ? d.igrejaId ?? null : null,
      filtroJson: d.filtroJson ? (d.filtroJson as object) : undefined,
      agendadoPara,
    },
  });

  if (enviarImediato) {
    const alvo = await alvoParaEnvio(d);
    const r = await enviarPush(alvo, {
      titulo: d.titulo,
      corpo: d.corpo,
      url: d.url,
      tag: push.id,
    });
    await prisma.pushNotification.update({
      where: { id: push.id },
      data: { enviadoEm: new Date(), totalEnviado: r.enviados },
    });
    return NextResponse.json({ ok: true, id: push.id, totalEnviado: r.enviados });
  }

  return NextResponse.json({ ok: true, id: push.id, rascunho: true });
}

async function alvoParaEnvio(d: z.infer<typeof schema>): Promise<AlvoEnvio> {
  if (d.alvo === "IGREJA" && d.igrejaId) {
    return { tipo: "IGREJA", igrejaId: d.igrejaId };
  }
  if (d.alvo === "CELULA" && d.filtroJson?.celulaId) {
    const celulaId = d.filtroJson.celulaId as string;
    const membros = await prisma.participanteCelula.findMany({
      where: { celulaId, ativo: true },
      select: { membro: { select: { usuario: { select: { id: true } } } } },
    });
    const usuarioIds = membros
      .map((p) => p.membro.usuario?.id)
      .filter((id): id is string => !!id);
    return { tipo: "USUARIOS", usuarioIds };
  }
  if (d.alvo === "CUSTOM" && d.filtroJson?.papel) {
    const papel = d.filtroJson.papel as string;
    const usuarios = await prisma.usuario.findMany({
      where: { papel: papel as never },
      select: { id: true },
    });
    return { tipo: "USUARIOS", usuarioIds: usuarios.map((u) => u.id) };
  }
  return { tipo: "TODOS" };
}
