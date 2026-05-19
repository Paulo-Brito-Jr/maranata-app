import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/push";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const titulo = "🏠 Sua célula te espera!";
  const corpo =
    "Hoje é dia de comunhão. Encontre sua célula mais próxima e participe.";

  const registro = await prisma.pushNotification.create({
    data: { titulo, corpo, alvo: "TODOS", agendadoPara: new Date() },
  });
  const resultado = await enviarPush(
    { tipo: "TODOS" },
    { titulo, corpo, url: "/membro/celula" },
  );
  await prisma.pushNotification.update({
    where: { id: registro.id },
    data: { enviadoEm: new Date(), totalEnviado: resultado.enviados },
  });

  return NextResponse.json({ ok: true, ...resultado });
}
