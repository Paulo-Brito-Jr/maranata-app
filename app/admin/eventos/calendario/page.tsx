import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = { title: "Calendário" };
export const dynamic = "force-dynamic";

const NOMES_MES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const NOMES_DIA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

type Search = { ano?: string; mes?: string };

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const hoje = new Date();
  const sp = await searchParams;
  const ano = sp.ano ? Number(sp.ano) : hoje.getFullYear();
  const mes = sp.mes ? Number(sp.mes) - 1 : hoje.getMonth();

  const inicioMes = new Date(ano, mes, 1);
  const fimMes = new Date(ano, mes + 1, 0, 23, 59, 59);

  const eventos = await prisma.evento.findMany({
    where: {
      inicio: { gte: inicioMes, lte: fimMes },
      publicado: true,
    },
    include: {
      categoria: { select: { nome: true, cor: true } },
      igreja: { select: { nome: true } },
    },
    orderBy: { inicio: "asc" },
  });

  const porDia = new Map<number, typeof eventos>();
  for (const e of eventos) {
    const d = e.inicio.getDate();
    const lista = porDia.get(d) ?? [];
    lista.push(e);
    porDia.set(d, lista);
  }

  const primeiroDiaSemana = inicioMes.getDay();
  const totalDias = fimMes.getDate();
  const cells: Array<{ dia: number | null; eventos: typeof eventos }> = [];
  for (let i = 0; i < primeiroDiaSemana; i++) cells.push({ dia: null, eventos: [] });
  for (let d = 1; d <= totalDias; d++)
    cells.push({ dia: d, eventos: porDia.get(d) ?? [] });
  while (cells.length % 7 !== 0) cells.push({ dia: null, eventos: [] });

  const anteriorAno = mes === 0 ? ano - 1 : ano;
  const anteriorMes = mes === 0 ? 12 : mes;
  const proximoAno = mes === 11 ? ano + 1 : ano;
  const proximoMes = mes === 11 ? 1 : mes + 2;

  return (
    <ModuloShell
      titulo={`Calendário · ${NOMES_MES[mes]} ${ano}`}
      descricao={`${eventos.length} evento(s) neste mês.`}
      stats={[]}
      acoes={[
        { href: "/admin/eventos", label: "← Lista" },
        { href: "/admin/eventos/novo", label: "Novo evento" },
      ]}
    >
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/eventos/calendario?ano=${anteriorAno}&mes=${anteriorMes}`}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary"
        >
          <ChevronLeft className="size-4" /> {NOMES_MES[anteriorMes - 1]}
        </Link>
        <Link
          href="/admin/eventos/calendario"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          hoje
        </Link>
        <Link
          href={`/admin/eventos/calendario?ano=${proximoAno}&mes=${proximoMes}`}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary"
        >
          {NOMES_MES[proximoMes - 1]} <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/30 text-center text-xs uppercase tracking-widest text-muted-foreground">
          {NOMES_DIA.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const ehHoje =
              cell.dia === hoje.getDate() &&
              mes === hoje.getMonth() &&
              ano === hoje.getFullYear();
            return (
              <div
                key={i}
                className={`min-h-[100px] border-b border-r border-border p-2 ${
                  cell.dia === null ? "bg-secondary/10" : ""
                }`}
              >
                {cell.dia !== null && (
                  <>
                    <div
                      className={`text-xs font-medium ${
                        ehHoje
                          ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {cell.dia}
                    </div>
                    <ul className="mt-1 space-y-1">
                      {cell.eventos.slice(0, 3).map((e) => (
                        <li key={e.id}>
                          <Link
                            href={`/admin/eventos/${e.id}`}
                            className="block truncate rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/25"
                            title={`${e.titulo} · ${e.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                          >
                            {e.inicio.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            {e.titulo}
                          </Link>
                        </li>
                      ))}
                      {cell.eventos.length > 3 && (
                        <li className="text-[10px] text-muted-foreground">
                          + {cell.eventos.length - 3}
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ModuloShell>
  );
}
