import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { brl } from "@/lib/utils";
import { getAppUrl } from "@/lib/safe2pay/config";

export const metadata = { title: "Financeiro" };
export const dynamic = "force-dynamic";

type Search = { contaId?: string; igrejaId?: string };

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const contaIdFiltro = sp.contaId && sp.contaId !== "todas" ? sp.contaId : null;
  const igrejaIdFiltro = sp.igrejaId && sp.igrejaId !== "todas" ? sp.igrejaId : null;

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const fimMes = new Date(inicioMes);
  fimMes.setMonth(fimMes.getMonth() + 1);

  const filtroLancBase = {
    ...(igrejaIdFiltro ? { igrejaId: igrejaIdFiltro } : {}),
    ...(contaIdFiltro ? { contaId: contaIdFiltro } : {}),
  };

  const [
    flag,
    igrejas,
    contasTodas,
    entradas,
    saidas,
    pendentes,
    totalDoacoesRecorrentes,
    campanhasAtivas,
  ] = await Promise.all([
    prisma.featureFlag.findUnique({ where: { chave: "multiple_financial_account" } }),
    prisma.igreja.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.contaBancaria.findMany({
      where: { ativa: true },
      select: {
        id: true,
        nome: true,
        banco: true,
        saldoInicial: true,
        igrejaId: true,
        igreja: { select: { nome: true } },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.lancamentoFinanceiro.aggregate({
      _sum: { valor: true },
      where: {
        tipo: "ENTRADA",
        data: { gte: inicioMes, lt: fimMes },
        status: { not: "CANCELADO" },
        ...filtroLancBase,
      },
    }),
    prisma.lancamentoFinanceiro.aggregate({
      _sum: { valor: true },
      where: {
        tipo: "SAIDA",
        data: { gte: inicioMes, lt: fimMes },
        status: { not: "CANCELADO" },
        ...filtroLancBase,
      },
    }),
    prisma.lancamentoFinanceiro.count({
      where: {
        status: "PENDENTE",
        ...filtroLancBase,
      },
    }),
    prisma.safe2PayAssinatura.count({ where: { ativa: true } }),
    prisma.campanha.findMany({
      where: { ativa: true },
      orderBy: { criadaEm: "desc" },
      take: 5,
    }),
  ]);

  const multiContaAtivo = !!flag?.habilitada;

  const entrMes = Number(entradas._sum.valor ?? 0);
  const saiMes = Number(saidas._sum.valor ?? 0);

  // Saldo por conta (saldoInicial + entradas - saidas, considerando todos os lançamentos)
  // Cálculo eficiente: 1 groupBy por contaId
  const contasParaShow = contasTodas.filter((c) => {
    if (igrejaIdFiltro && c.igrejaId !== igrejaIdFiltro) return false;
    if (contaIdFiltro && c.id !== contaIdFiltro) return false;
    return true;
  });

  type GroupItem = { contaId: string | null; tipo: "ENTRADA" | "SAIDA"; _sum: { valor: unknown } };
  const groups = (await prisma.lancamentoFinanceiro.groupBy({
    by: ["contaId", "tipo"],
    where: {
      status: { not: "CANCELADO" },
      contaId: { in: contasParaShow.map((c) => c.id) },
    },
    _sum: { valor: true },
  })) as unknown as GroupItem[];

  const saldosPorConta = new Map<string, number>();
  for (const c of contasParaShow) {
    saldosPorConta.set(c.id, Number(c.saldoInicial));
  }
  for (const g of groups) {
    if (!g.contaId) continue;
    const v = Number(g._sum.valor ?? 0);
    const atual = saldosPorConta.get(g.contaId) ?? 0;
    saldosPorConta.set(g.contaId, atual + (g.tipo === "ENTRADA" ? v : -v));
  }
  const caixaTotal = Array.from(saldosPorConta.values()).reduce((a, b) => a + b, 0);

  const doacaoUrl = `${getAppUrl()}/doar`;
  const whatsappTexto = encodeURIComponent(
    `Contribua com a obra da Igreja Missionária Evangélica Maranata: ${doacaoUrl}`,
  );

  // Restringe dropdown de contas pela igreja selecionada (UX)
  const contasParaDropdown = contasTodas.filter(
    (c) => !igrejaIdFiltro || c.igrejaId === igrejaIdFiltro,
  );

  return (
    <ModuloShell
      titulo="Financeiro"
      descricao="Entradas, saídas, doações Safe2Pay (recorrentes e avulsas), campanhas, conciliação OFX, multi-conta por igreja."
      stats={[
        { label: "Caixa total", valor: brl(caixaTotal), ref: `${contasParaShow.length} conta(s)` },
        { label: "Entradas (mês)", valor: brl(entrMes) },
        { label: "Saídas (mês)", valor: brl(saiMes) },
        { label: "Pendentes", valor: pendentes },
      ]}
      acoes={[
        { href: "/admin/financeiro/lancamentos/novo", label: "Novo lançamento" },
        { href: "/admin/financeiro/importar-ofx", label: "Importar OFX" },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
          action="/admin/financeiro"
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
              href="/admin/financeiro"
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
            >
              Limpar
            </Link>
          )}
        </form>
      </section>

      {multiContaAtivo ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Saldo por conta ({contasParaShow.length})
            </h2>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
              flag multi-conta ativa
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contasParaShow.map((c) => {
              const saldo = saldosPorConta.get(c.id) ?? 0;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.nome}</div>
                      {c.igreja && (
                        <div className="text-xs text-muted-foreground">{c.igreja.nome}</div>
                      )}
                      {c.banco && (
                        <div className="text-xs text-muted-foreground">{c.banco}</div>
                      )}
                    </div>
                    <Link
                      href={`/admin/financeiro/fluxo-caixa?contaId=${c.id}`}
                      className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-secondary"
                    >
                      Fluxo
                    </Link>
                  </div>
                  <div
                    className={`mt-3 text-2xl font-semibold ${
                      saldo >= 0 ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {brl(saldo)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border bg-card/40 p-5">
          <h2 className="text-sm font-semibold">Multi-conta por igreja</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada uma das 15 igrejas já tem uma conta bancária cadastrada. Para mostrar todos os
            saldos por conta nesta tela, ative a feature flag{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">multiple_financial_account</code>.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">🎯 Ação 2 do plano — Recorrência Safe2Pay</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Potencial estimado: R$ 50-150k/ano. Hoje {totalDoacoesRecorrentes} doações
              recorrentes ativas.
            </p>
          </div>
          <Link
            href="/doar"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Ver página pública
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Divulgação do link de doações</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use este link em push, WhatsApp, QR Code impresso ou telão. Ele aceita doação avulsa
              e dízimo mensal.
            </p>
            <code className="mt-3 block rounded-xl bg-secondary px-3 py-2 text-sm">
              {doacaoUrl}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={doacaoUrl}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Abrir link
            </a>
            <a
              href={`https://wa.me/?text=${whatsappTexto}`}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Compartilhar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Campanhas ativas</h2>
            <Link href="/admin/financeiro/campanhas" className="text-xs text-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          {campanhasAtivas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma campanha ativa.{" "}
              <Link href="/admin/financeiro/campanhas/nova" className="text-primary hover:underline">
                Crie a primeira
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {campanhasAtivas.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/admin/financeiro/campanhas/${c.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {c.titulo}
                  </Link>
                  <span className="text-muted-foreground">
                    {brl(Number(c.arrecadado))}
                    {c.meta && ` / ${brl(Number(c.meta))}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Atalhos</h2>
          <div className="grid gap-2 text-sm">
            <Link
              href="/admin/financeiro/lancamentos"
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary"
            >
              <span>Todos os lançamentos</span>
              <span className="text-muted-foreground">→</span>
            </Link>
            <Link
              href="/admin/financeiro/dre"
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary"
            >
              <span>DRE (12 meses)</span>
              <span className="text-muted-foreground">→</span>
            </Link>
            <Link
              href="/admin/financeiro/fluxo-caixa"
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary"
            >
              <span>Fluxo de caixa</span>
              <span className="text-muted-foreground">→</span>
            </Link>
            <Link
              href="/admin/financeiro/importar-ofx"
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary"
            >
              <span>Importar OFX</span>
              <span className="text-muted-foreground">→</span>
            </Link>
            <Link
              href="/admin/financeiro/campanhas"
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary"
            >
              <span>Todas as campanhas</span>
              <span className="text-muted-foreground">→</span>
            </Link>
          </div>
        </div>
      </section>
    </ModuloShell>
  );
}
