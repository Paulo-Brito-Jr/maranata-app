import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/push";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const titulo = "💚 Honre o Senhor com seu dízimo";
  const corpo =
    '"Trazei todos os dízimos à casa do tesouro." Doe agora com poucos cliques.';

  const registro = await prisma.pushNotification.create({
    data: { titulo, corpo, alvo: "TODOS", agendadoPara: new Date() },
  });
  const resultado = await enviarPush(
    { tipo: "TODOS" },
    { titulo, corpo, url: "/doar" },
  );
  await prisma.pushNotification.update({
    where: { id: registro.id },
    data: { enviadoEm: new Date(), totalEnviado: resultado.enviados },
  });

  return NextResponse.json({ ok: true, ...resultado });
}
