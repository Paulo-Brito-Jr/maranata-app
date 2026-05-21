import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/push";

/**
 * Cron Vercel — a cada 6h.
 * Lista pedidos com prazoSla < NOW() e status=EM_ORACAO,
 * envia push pro intercessor pra cobrar a resposta.
 */
export async function GET(req: Request) {
  if (
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const agora = new Date();

  const pedidosVencidos = await prisma.pedidoOracao.findMany({
    where: {
      status: "EM_ORACAO",
      prazoSla: { lt: agora },
      intercessorId: { not: null },
    },
    select: {
      id: true,
      pedido: true,
      intercessorId: true,
      prazoSla: true,
      membro: { select: { nome: true } },
      nomeAvulso: true,
    },
    take: 500,
  });

  if (pedidosVencidos.length === 0) {
    return NextResponse.json({ alertados: 0, vencidos: 0 });
  }

  // Agrupa por intercessor (que é o membroId)
  const porIntercessor = new Map<string, typeof pedidosVencidos>();
  for (const p of pedidosVencidos) {
    if (!p.intercessorId) continue;
    if (!porIntercessor.has(p.intercessorId))
      porIntercessor.set(p.intercessorId, []);
    porIntercessor.get(p.intercessorId)!.push(p);
  }

  // Resolve cada intercessor (Membro) -> Usuario/UsuarioApp para push
  const membroIds = [...porIntercessor.keys()];
  const membros = await prisma.membro.findMany({
    where: { id: { in: membroIds } },
    select: {
      id: true,
      nome: true,
      usuarioId: true,
      usuarioAppId: true,
    },
  });
  const membroMap = new Map(membros.map((m) => [m.id, m]));

  let alertados = 0;
  let semPushSub = 0;

  for (const [intercessorId, lista] of porIntercessor.entries()) {
    const membro = membroMap.get(intercessorId);
    if (!membro) continue;

    const titulo =
      lista.length === 1
        ? "🙏 Pedido vencido (SLA 48h)"
        : `🙏 ${lista.length} pedidos vencidos (SLA 48h)`;
    const exemplo = lista[0];
    const nomeQuemPediu =
      exemplo.membro?.nome ?? exemplo.nomeAvulso ?? "Anônimo";
    const corpo =
      lista.length === 1
        ? `${nomeQuemPediu}: ${exemplo.pedido.slice(0, 100)}`
        : `Incluindo "${nomeQuemPediu}". Abra pra responder.`;

    let enviou = 0;
    if (membro.usuarioId) {
      const r = await enviarPush(
        { tipo: "USUARIO", usuarioId: membro.usuarioId },
        {
          titulo,
          corpo,
          url: "/membro/oracao",
          tag: `prayer-sla-${intercessorId}`,
        },
      );
      enviou += r.enviados;
    }
    if (membro.usuarioAppId) {
      const r = await enviarPush(
        { tipo: "USUARIO_APP", usuarioAppId: membro.usuarioAppId },
        {
          titulo,
          corpo,
          url: "/membro/oracao",
          tag: `prayer-sla-${intercessorId}`,
        },
      );
      enviou += r.enviados;
    }

    if (enviou > 0) {
      alertados++;
    } else {
      semPushSub++;
    }
  }

  return NextResponse.json({
    alertados,
    semPushSub,
    vencidos: pedidosVencidos.length,
    intercessores: porIntercessor.size,
  });
}
