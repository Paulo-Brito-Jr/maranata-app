import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/push";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const titulo = "✨ Quinta Viva com Cristo";
  const corpo = "Hoje às 20h. Vem renovar a fé com a gente!";

  const registro = await prisma.pushNotification.create({
    data: { titulo, corpo, alvo: "TODOS", agendadoPara: new Date() },
  });
  const resultado = await enviarPush(
    { tipo: "TODOS" },
    { titulo, corpo, url: "/eventos" },
  );
  await prisma.pushNotification.update({
    where: { id: registro.id },
    data: { enviadoEm: new Date(), totalEnviado: resultado.enviados },
  });

  return NextResponse.json({ ok: true, ...resultado });
}
