import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/push";

export async function GET(req: NextRequest) {
  // Cron Vercel envia header Authorization quando configurado com CRON_SECRET
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth();

  const membros = await prisma.membro.findMany({
    where: {
      status: "ATIVO",
      optAniversario: true,
      dataNascimento: { not: null },
    },
    select: {
      id: true,
      nome: true,
      dataNascimento: true,
      usuario: { select: { id: true } },
    },
  });

  const aniversariantes = membros.filter(
    (m) =>
      m.dataNascimento &&
      m.dataNascimento.getDate() === dia &&
      m.dataNascimento.getMonth() === mes,
  );

  if (aniversariantes.length === 0) {
    return NextResponse.json({ ok: true, total: 0 });
  }

  // Notifica os próprios aniversariantes
  const proprios = aniversariantes
    .map((a) => a.usuario?.id)
    .filter((id): id is string => !!id);
  if (proprios.length > 0) {
    await enviarPush(
      { tipo: "USUARIOS", usuarioIds: proprios },
      {
        titulo: "🎂 Feliz aniversário, irmão!",
        corpo: "A família Maranata celebra sua vida hoje. Que Deus te abençoe!",
        url: "/membro",
        tag: `aniversario-${hoje.toISOString().slice(0, 10)}`,
      },
    );
  }

  // Cria um PushNotification público "Hoje aniversariam: X, Y, Z" pra todos
  const nomes = aniversariantes.map((a) => a.nome.split(" ")[0]).slice(0, 10);
  const corpo = `Hoje aniversariam: ${nomes.join(", ")}${aniversariantes.length > 10 ? " e outros" : ""}. Envie um abraço!`;

  await prisma.pushNotification.create({
    data: {
      titulo: "🎂 Aniversariantes de hoje",
      corpo,
      alvo: "TODOS",
      enviadoEm: new Date(),
      filtroJson: { tipo: "aniversariantes", aniversariantesIds: aniversariantes.map((a) => a.id) },
    },
  });

  const r = await enviarPush(
    { tipo: "TODOS" },
    {
      titulo: "🎂 Aniversariantes de hoje",
      corpo,
      url: "/membro",
      tag: `aniversario-broadcast-${hoje.toISOString().slice(0, 10)}`,
    },
  );

  return NextResponse.json({
    ok: true,
    total: aniversariantes.length,
    enviadosProprios: proprios.length,
    broadcast: r.enviados,
  });
}
