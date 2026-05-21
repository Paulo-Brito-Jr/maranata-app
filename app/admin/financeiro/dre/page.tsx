import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { brl } from "@/lib/utils";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";

export const metadata = { title: "DRE" };
export const dynamic = "force-dynamic";

type Search = { igrejaId?: string };

type LinhaCategoria = {
  id: string;
  nome: string;
  tipo: "ENTRADA" | "SAIDA";
  porMes: number[];
  total: number;
};

const NOMES_MES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default async function DrePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const ctx = await getIgrejaContexto();
  const ctxFiltro = filtroIgrejaWhere(ctx);
  const igrejaIdFiltro =
    sp.igrejaId && sp.igrejaId !== "todas" ? sp.igrejaId : ctxFiltro.igrejaId ?? null;

  // Janela: últimos 12 meses completos terminando no mês corrente
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

  // Lista 12 colunas (year, month)
  const colunas: { year: number; month: number; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
    colunas.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${NOMES_MES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
    });
  }

  const [igrejas, lancamentos, categorias] = await Promise.all([
    prisma.igreja.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.lancamentoFinanceiro.findMany({
      where: {
        data: { gte: inicio, lt: fim },
        ...(igrejaIdFiltro ? { igrejaId: igrejaIdFiltro } : {}),
      },
      select: {
        tipo: true,
        valor: true,
        data: true,
        categoriaId: true,
      },
    }),
    prisma.categoriaFinanceira.findMany({
      select: { id: true, nome: true, tipo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  // Indexa categorias por id
  const catById = new Map(categorias.map((c) => [c.id, c]));

  // Inicializa linhas (todas categorias + uma "Sem categoria" por tipo)
  const linhasMap = new Map<string, LinhaCategoria>();
  function ensure(key: string, nome: string, tipo: "ENTRADA" | "SAIDA") {
    if (linhasMap.has(key)) return linhasMap.get(key)!;
    const linha: LinhaCategoria = {
      id: key,
      nome,
      tipo,
      porMes: Array(12).fill(0),
      total: 0,
    };
    linhasMap.set(key, linha);
    return linha;
  }

  // Pré-popular categorias conhecidas pra aparecerem mesmo sem lançamento (útil pra UX)
  for (const c of categorias) {
    ensure(c.id, c.nome, c.tipo as "ENTRADA" | "SAIDA");
  }

  // Totais por mês
  const totalEntPorMes = Array(12).fill(0);
  const totalSaiPorMes = Array(12).fill(0);

  for (const l of lancamentos) {
    const d = l.data;
    const idx = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth());
    if (idx < 0 || idx >= 12) continue;

    const v = Number(l.valor);
    const cat = l.categoriaId ? catById.get(l.categoriaId) : null;
    const tipoLan = l.tipo as "ENTRADA" | "SAIDA";
    const linhaKey = cat?.id ?? `_sem_${tipoLan}`;
    const nome = cat?.nome ?? "Sem categoria";
    const linha = ensure(linhaKey, nome, tipoLan);

    linha.porMes[idx] += v;
    linha.total += v;

    if (tipoLan === "ENTRADA") totalEntPorMes[idx] += v;
    else totalSaiPorMes[idx] += v;
  }

  // Separa entradas e saídas
  const entradas = Array.from(linhasMap.values())
    .filter((l) => l.tipo === "ENTRADA")
    .sort((a, b) => b.total - a.total);
  const saidas = Array.from(linhasMap.values())
    .filter((l) => l.tipo === "SAIDA")
    .sort((a, b) => b.total - a.total);

  const totalEnt = totalEntPorMes.reduce((a, b) => a + b, 0);
  const totalSai = totalSaiPorMes.reduce((a, b) => a + b, 0);
  const liquido = totalEnt - totalSai;

  const igrejaSelecionada = igrejaIdFiltro
    ? igrejas.find((i) => i.id === igrejaIdFiltro)?.nome ?? "Igreja"
    : "Todas as igrejas";

  return (
    <ModuloShell
      titulo="DRE — últimos 12 meses"
      descricao={`Receitas vs despesas, mês a mês, por categoria. Filtro: ${igrejaSelecionada}.`}
      stats={[
        { label: "Receitas (12m)", valor: brl(totalEnt) },
        { label: "Despesas (12m)", valor: brl(totalSai) },
        { label: "Resultado (12m)", valor: brl(liquido) },
      ]}
      acoes={[
        { href: "/admin/financeiro", label: "← Voltar" },
        {
          href: `/api/financeiro/exportar?ano=${hoje.getFullYear()}`,
          label: "Exportar CSV (ano)",
        },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <form className="flex flex-wrap items-end gap-3" action="/admin/financeiro/dre">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Filtrar por igreja
            </label>
            <select
              name="igrejaId"
              defaultValue={igrejaIdFiltro ?? "todas"}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="todas">Todas as igrejas</option>
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Aplicar
          </button>
          {igrejaIdFiltro && (
            <Link
              href="/admin/financeiro/dre"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
            >
              Limpar
            </Link>
          )}
        </form>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[900px] text-xs sm:text-sm">
          <thead className="border-b border-border bg-secondary/40">
            <tr>
              <th className="sticky left-0 z-10 bg-secondary/40 px-3 py-2 text-left font-medium">
                Categoria
              </th>
              {colunas.map((c) => (
                <th
                  key={`${c.year}-${c.month}`}
                  className="px-2 py-2 text-right font-medium text-muted-foreground"
                >
                  {c.label}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* RECEITAS */}
            <tr className="bg-emerald-500/10">
              <td colSpan={14} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-300">
                Receitas
              </td>
            </tr>
            {entradas.length === 0 && (
              <tr>
                <td colSpan={14} className="px-3 py-3 text-center text-muted-foreground">
                  Nenhuma entrada no período.
                </td>
              </tr>
            )}
            {entradas.map((l) => (
              <tr key={l.id} className="hover:bg-secondary/30">
                <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium">{l.nome}</td>
                {l.porMes.map((v, i) => (
                  <td
                    key={i}
                    className={`px-2 py-2 text-right font-mono ${
                      v > 0 ? "text-emerald-300" : "text-muted-foreground/60"
                    }`}
                  >
                    {v > 0 ? brl(v) : "—"}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-300">
                  {brl(l.total)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-emerald-500/30 bg-emerald-500/5">
              <td className="sticky left-0 z-10 bg-emerald-500/10 px-3 py-2 font-semibold">
                Total Receita
              </td>
              {totalEntPorMes.map((v, i) => (
                <td key={i} className="px-2 py-2 text-right font-mono font-semibold text-emerald-300">
                  {v > 0 ? brl(v) : "—"}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-mono font-bold text-emerald-300">
                {brl(totalEnt)}
              </td>
            </tr>

            {/* DESPESAS */}
            <tr className="bg-rose-500/10">
              <td colSpan={14} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-rose-300">
                Despesas
              </td>
            </tr>
            {saidas.length === 0 && (
              <tr>
                <td colSpan={14} className="px-3 py-3 text-center text-muted-foreground">
                  Nenhuma saída no período.
                </td>
              </tr>
            )}
            {saidas.map((l) => (
              <tr key={l.id} className="hover:bg-secondary/30">
                <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium">{l.nome}</td>
                {l.porMes.map((v, i) => (
                  <td
                    key={i}
                    className={`px-2 py-2 text-right font-mono ${
                      v > 0 ? "text-rose-300" : "text-muted-foreground/60"
                    }`}
                  >
                    {v > 0 ? brl(v) : "—"}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-mono font-semibold text-rose-300">
                  {brl(l.total)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-rose-500/30 bg-rose-500/5">
              <td className="sticky left-0 z-10 bg-rose-500/10 px-3 py-2 font-semibold">
                Total Despesa
              </td>
              {totalSaiPorMes.map((v, i) => (
                <td key={i} className="px-2 py-2 text-right font-mono font-semibold text-rose-300">
                  {v > 0 ? brl(v) : "—"}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-mono font-bold text-rose-300">
                {brl(totalSai)}
              </td>
            </tr>

            {/* RESULTADO */}
            <tr className="border-t-2 border-border bg-secondary/50">
              <td className="sticky left-0 z-10 bg-secondary/50 px-3 py-2 font-bold">
                Resultado
              </td>
              {colunas.map((_, i) => {
                const r = totalEntPorMes[i] - totalSaiPorMes[i];
                return (
                  <td
                    key={i}
                    className={`px-2 py-2 text-right font-mono font-bold ${
                      r >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {brl(r)}
                  </td>
                );
              })}
              <td
                className={`px-3 py-2 text-right font-mono font-bold ${
                  liquido >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {brl(liquido)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <p className="text-xs text-muted-foreground">
        Janela: {NOMES_MES[colunas[0].month]}/{colunas[0].year} a {NOMES_MES[colunas[11].month]}/{colunas[11].year}. Cor verde = entrada · vermelho = saída.
      </p>
    </ModuloShell>
  );
}
