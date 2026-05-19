import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const agora = new Date();
  try {
    const [total, publicados, proximos, recentes, recentesViaSql] = await Promise.all([
      prisma.evento.count(),
      prisma.evento.count({ where: { publicado: true } }),
      prisma.evento.count({ where: { publicado: true, inicio: { gte: agora } } }),
      prisma.evento.count({ where: { publicado: true, inicio: { lt: agora } } }),
      prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*)::bigint as count FROM "Evento" WHERE publicado=true AND inicio < $1`,
        agora,
      ),
    ]);
    return NextResponse.json({
      ok: true,
      agora: agora.toISOString(),
      total,
      publicados,
      proximos,
      recentes,
      recentesViaSql: Number(recentesViaSql[0]?.count ?? 0),
      env: {
        hasDatabase: !!process.env.DATABASE_URL,
        hasDirect: !!process.env.DIRECT_URL,
        databaseHost: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? null,
      },
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      erro: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.split("\n").slice(0, 5) : null,
    }, { status: 500 });
  }
}
