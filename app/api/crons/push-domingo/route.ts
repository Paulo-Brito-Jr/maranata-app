import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron Vercel — domingo 8h BRT (11 UTC).
 * Cria um push notification agendado pra todos os usuários do app.
 * Envio real (Web Push + FCM) fica F6.1.
 */
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await prisma.pushNotification.create({
    data: {
      titulo: "🙏 Bom dia, família Maranata!",
      corpo:
        "Hoje é dia de adoração. Veja os horários da sua igreja local e vem com a gente.",
      alvo: "TODOS",
      agendadoPara: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
