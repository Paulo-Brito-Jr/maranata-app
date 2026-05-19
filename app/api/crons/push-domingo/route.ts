import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/push";

/**
 * Cron Vercel — domingo 8h BRT (11 UTC).
 * Cria registro + envia push real pra todos os assinantes.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const titulo = "🙏 Bom dia, família Maranata!";
  const corpo =
    "Hoje é dia de adoração. Veja os horários da sua igreja local e vem com a gente.";

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
