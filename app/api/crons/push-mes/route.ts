import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await prisma.pushNotification.create({
    data: {
      titulo: "💚 Honre o Senhor com seu dízimo",
      corpo:
        "\"Trazei todos os dízimos à casa do tesouro.\" Doe agora com poucos cliques.",
      alvo: "TODOS",
      agendadoPara: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
