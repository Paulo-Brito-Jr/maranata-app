import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { brl } from "@/lib/utils";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import { FluxoCaixaChart, type FluxoCaixaPoint } from "./chart-client";

export const metadata = { title: "Fluxo de caixa" };
export const dynamic = "force-dynamic";

type Search = { igrejaId?: string; contaId?: string };

const DIAS = 90;

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dmy(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${m}`;
}

export default async function FluxoCaixaPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const ctx = await getIgrejaContexto();
  const ctxFiltro = filtroIgrejaWhere(ctx);
  const igrejaIdFiltro =
    sp.igrejaId && sp.igrejaId !== "todas" ? sp.igrejaId : ctxFiltro.igrejaId ?? null;
  const contaIdFiltro = sp.contaId && sp.contaId !== "todas" ? sp.contaId : null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - (DIAS - 1));

  const [igrejas, contas, contasFiltradas, lancamentos] = await Promise.all([
    prisma.igreja.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.contaBancaria.findMany({
      where: { ativa: true },
      select: { id: true, nome: true, igrejaId: true, saldoInicial: true },
      orderBy: { nome: "asc" },
    }),
    // Contas que servem pro cálculo do saldo inicial (filtradas)
    prisma.contaBancaria.findMany({
      where: {
        ativa: true,
        ...(contaIdFiltro ? { id: contaIdFiltro } : {}),
        ...(igrejaIdFiltro ? { igrejaId: igrejaIdFiltro } : {}),
      },
      select: { id: true, saldoInicial: true },
    }),
    prisma.lancamentoFinanceiro.findMany({
      where: {
        data: { gte: inicio },
        status: { not: "CANCELADO" },
        ...(igrejaIdFiltro ? { igrejaId: igrejaIdFiltro } : {}),
        ...(contaIdFiltro ? { contaId: contaIdFiltro } : {}),
      },
      select: { tipo: true, valor: true, data: true },
    }),
  ]);

  // Inicializa 90 buckets
  const buckets: FluxoCaixaPoint[] = [];
  const idxByDate = new Map<string, number>();
  for (let i = 0; i < DIAS; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    const key = ymd(d);
    idxByDate.set(key, i);
    buckets.push({
      data: key,
      label: dmy(d),
      entradas: 0,
      saidas: 0,
      liquidoDia: 0,
      saldoAcumulado: 0,
    });
  }

  for (const l of lancamentos) {
    const key = ymd(new Date(l.data));
    const idx = idxByDate.get(key);
    if (idx === undefined) continue;
    const v = Number(l.valor);
    if (l.tipo === "ENTRADA") buckets[idx].entradas += v;
    else buckets[idx].saidas += v;
  }

  // Saldo inicial = soma dos saldoInicial das contas filtradas
  const saldoInicial = contasFiltradas.reduce((acc, c) => acc + Number(c.saldoInicial), 0);
  let acumulado = saldoInicial;
  for (let i = 0; i < DIAS; i++) {
    buckets[i].liquidoDia = buckets[i].entradas - buckets[i].saidas;
    acumulado += buckets[i].liquidoDia;
    buckets[i].saldoAcumulado = acumulado;
  }

  const totalEntradas = buckets.reduce((a, b) => a + b.entradas, 0);
  const totalSaidas = buckets.reduce((a, b) => a + b.saidas, 0);
  const saldoFinal = buckets[buckets.length - 1].saldoAcumulado;

  // Pra montar dropdown de conta, filtrar por igreja se selecionada
  const contasParaDropdown = contas.filter(
    (c) => !igrejaIdFiltro || c.igrejaId === igrejaIdFiltro,
  );

  return (
    <ModuloShell
      titulo="Fluxo de caixa"
      descricao={`Saldo acumulado diário nos últimos ${DIAS} dias.`}
      stats={[
        { label: "Saldo inicial", valor: brl(saldoInicial) },
        { label: "Entradas (90d)", valor: brl(totalEntradas) },
        { label: "Saídas (90d)", valor: brl(totalSaidas) },
        { label: "Saldo atual", valor: brl(saldoFinal) },
      ]}
      acoes={[{ href: "/admin/financeiro", label: "← Voltar" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
          action="/admin/financeiro/fluxo-caixa"
        >
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Igreja
            </label>
            <select
              name="igrejaId"
              defaultValue={igrejaIdFiltro ?? "todas"}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="todas">Todas</option>
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Conta
            </label>
            <select
              name="contaId"
              defaultValue={contaIdFiltro ?? "todas"}
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="todas">Todas</option>
              {contasParaDropdown.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
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
          {(igrejaIdFiltro || contaIdFiltro) && (
            <Link
              href="/admin/financeiro/fluxo-caixa"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
            >
              Limpar
            </Link>
          )}
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Saldo acumulado diário
        </h2>
        <FluxoCaixaChart data={buckets} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border">
        <h2 className="border-b border-border bg-secondary/40 px-4 py-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Últimos 15 dias
        </h2>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/30 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-right">Entradas</th>
              <th className="px-3 py-2 text-right">Saídas</th>
              <th className="px-3 py-2 text-right">Líquido</th>
              <th className="px-3 py-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {buckets
              .slice(-15)
              .reverse()
              .map((b) => (
                <tr key={b.data}>
                  <td className="px-3 py-2 text-muted-foreground">{b.label}</td>
                  <td className="px-3 py-2 text-right text-emerald-300">
                    {b.entradas > 0 ? brl(b.entradas) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-rose-300">
                    {b.saidas > 0 ? brl(b.saidas) : "—"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono ${
                      b.liquidoDia >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {brl(b.liquidoDia)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-semibold ${
                      b.saldoAcumulado >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {brl(b.saldoAcumulado)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </ModuloShell>
  );
}
