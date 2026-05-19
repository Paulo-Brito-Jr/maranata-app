import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { brl } from "@/lib/utils";

export const metadata = { title: "DRE" };
export const dynamic = "force-dynamic";

type Search = { ano?: string };

export default async function DrePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const ano = sp.ano ? Number(sp.ano) : new Date().getFullYear();
  const inicio = new Date(ano, 0, 1);
  const fim = new Date(ano + 1, 0, 1);

  const [todos, porCategoria] = await Promise.all([
    prisma.lancamentoFinanceiro.findMany({
      where: { data: { gte: inicio, lt: fim } },
      select: { tipo: true, valor: true, data: true, categoria: { select: { nome: true, cor: true } } },
    }),
    prisma.lancamentoFinanceiro.groupBy({
      by: ["tipo", "categoriaId"],
      where: { data: { gte: inicio, lt: fim } },
      _sum: { valor: true },
    }),
  ]);

  // Agrupa por mês
  const meses = Array.from({ length: 12 }, (_, m) => ({
    mes: m,
    entradas: 0,
    saidas: 0,
  }));
  for (const l of todos) {
    const m = l.data.getMonth();
    const v = Number(l.valor);
    if (l.tipo === "ENTRADA") meses[m].entradas += v;
    else meses[m].saidas += v;
  }

  const totalEnt = meses.reduce((a, m) => a + m.entradas, 0);
  const totalSai = meses.reduce((a, m) => a + m.saidas, 0);
  const liquido = totalEnt - totalSai;
  const maxBarra = Math.max(...meses.flatMap((m) => [m.entradas, m.saidas]), 1);

  // Por categoria
  const categoriasMap = new Map<string, { nome: string; ent: number; sai: number }>();
  for (const g of porCategoria) {
    const k = g.categoriaId ?? "_sem";
    const cur = categoriasMap.get(k) ?? { nome: "Sem categoria", ent: 0, sai: 0 };
    const v = Number(g._sum.valor ?? 0);
    if (g.tipo === "ENTRADA") cur.ent += v;
    else cur.sai += v;
    categoriasMap.set(k, cur);
  }
  const catIds = Array.from(categoriasMap.keys()).filter((k) => k !== "_sem");
  const catsDados = await prisma.categoriaFinanceira.findMany({
    where: { id: { in: catIds } },
    select: { id: true, nome: true },
  });
  for (const c of catsDados) {
    const cur = categoriasMap.get(c.id)!;
    cur.nome = c.nome;
  }

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

  return (
    <ModuloShell
      titulo={`DRE ${ano}`}
      descricao="Demonstrativo de resultado por competência. Entradas vs saídas mês a mês."
      stats={[
        { label: "Entradas", valor: brl(totalEnt) },
        { label: "Saídas", valor: brl(totalSai) },
        { label: "Líquido", valor: brl(liquido) },
      ]}
      acoes={[
        { href: "/admin/financeiro", label: "← Voltar" },
        { href: `/api/financeiro/exportar?ano=${ano}`, label: "Exportar CSV" },
      ]}
    >
      <div className="flex items-center gap-2">
        {[ano - 2, ano - 1, ano, ano + 1].map((y) => (
          <Link
            key={y}
            href={`/admin/financeiro/dre?ano=${y}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              y === ano
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border bg-card hover:bg-secondary"
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Mês a mês
        </h2>
        <div className="space-y-2">
          {meses.map((m) => (
            <div key={m.mes} className="grid grid-cols-[40px_1fr_140px] items-center gap-3 text-xs">
              <span className="text-muted-foreground">{NOMES_MES[m.mes]}</span>
              <div className="space-y-1">
                <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="bg-emerald-500/60"
                    style={{ width: `${(m.entradas / maxBarra) * 100}%` }}
                  />
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="bg-rose-500/60"
                    style={{ width: `${(m.saidas / maxBarra) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-right font-mono">
                <p className="text-emerald-300">+{brl(m.entradas)}</p>
                <p className="text-rose-300">-{brl(m.saidas)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Por categoria
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Categoria</th>
                <th className="px-3 py-2 text-right">Entradas</th>
                <th className="px-3 py-2 text-right">Saídas</th>
                <th className="px-3 py-2 text-right">Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {Array.from(categoriasMap.entries()).map(([k, c]) => (
                <tr key={k}>
                  <td className="px-3 py-2 font-medium">{c.nome}</td>
                  <td className="px-3 py-2 text-right text-emerald-300">{brl(c.ent)}</td>
                  <td className="px-3 py-2 text-right text-rose-300">{brl(c.sai)}</td>
                  <td className="px-3 py-2 text-right font-mono">{brl(c.ent - c.sai)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </ModuloShell>
  );
}
