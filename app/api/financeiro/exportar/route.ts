import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s}"`;
  return s;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN", "PASTOR_DIRETORIA", "FINANCEIRO");
  } catch {
    return new Response("Sem permissão", { status: 403 });
  }

  const url = new URL(req.url);
  const ano = Number(url.searchParams.get("ano") ?? new Date().getFullYear());
  const inicio = new Date(ano, 0, 1);
  const fim = new Date(ano + 1, 0, 1);

  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where: { data: { gte: inicio, lt: fim } },
    include: {
      categoria: { select: { nome: true } },
      conta: { select: { nome: true } },
      igreja: { select: { nome: true } },
      fornecedor: { select: { nome: true } },
    },
    orderBy: { data: "asc" },
  });

  const linhas = [
    [
      "Data",
      "Tipo",
      "Status",
      "Igreja",
      "Categoria",
      "Conta",
      "Fornecedor",
      "Descrição",
      "Forma pagamento",
      "Valor",
    ].join(","),
  ];

  for (const l of lancamentos) {
    linhas.push(
      [
        l.data.toISOString().slice(0, 10),
        l.tipo,
        l.status,
        l.igreja.nome,
        l.categoria?.nome ?? "",
        l.conta?.nome ?? "",
        l.fornecedor?.nome ?? "",
        l.descricao ?? "",
        l.formaPagamento ?? "",
        Number(l.valor).toFixed(2),
      ]
        .map(escapeCsv)
        .join(","),
    );
  }

  const csv = linhas.join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="maranata-financeiro-${ano}.csv"`,
    },
  });
}
