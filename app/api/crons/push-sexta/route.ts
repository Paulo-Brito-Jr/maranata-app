import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await prisma.pushNotification.create({
    data: {
      titulo: "🏠 Sua célula te espera!",
      corpo:
        "Hoje é dia de comunhão. Encontre sua célula mais próxima e participe.",
      alvo: "TODOS",
      agendadoPara: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
