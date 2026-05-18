import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await prisma.pushNotification.create({
    data: {
      titulo: "✨ Quinta Viva com Cristo",
      corpo: "Hoje às 20h. Vem renovar a fé com a gente!",
      alvo: "TODOS",
      agendadoPara: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
