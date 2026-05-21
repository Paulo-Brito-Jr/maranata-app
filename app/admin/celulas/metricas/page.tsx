import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Métricas de células" };
export const dynamic = "force-dynamic";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function MetricasCelulasPage() {
  const inicio30d = subDays(new Date(), 30);
  const [
    total,
    ativas,
    inativas,
    emMultiplicacao,
    porRede,
    porIgreja,
    porDia,
    topPorParticipantes,
    relatorios30d,
  ] = await Promise.all([
    prisma.celula.count(),
    prisma.celula.count({ where: { status: "ATIVA" } }),
    prisma.celula.count({ where: { status: "INATIVA" } }),
    prisma.celula.count({ where: { status: "EM_MULTIPLICACAO" } }),
    prisma.celula.groupBy({
      by: ["redeId"],
      _count: { _all: true },
      orderBy: { _count: { redeId: "desc" } },
      take: 12,
    }),
    prisma.celula.groupBy({
      by: ["igrejaId"],
      _count: { _all: true },
      orderBy: { _count: { igrejaId: "desc" } },
    }),
    prisma.celula.groupBy({
      by: ["diaSemana"],
      _count: { _all: true },
      where: { status: "ATIVA" },
      orderBy: { diaSemana: "asc" },
    }),
    prisma.celula.findMany({
      where: { status: "ATIVA" },
      include: {
        _count: { select: { participantes: true } },
        igreja: { select: { nome: true } },
        rede: { select: { nome: true } },
      },
      orderBy: { participantes: { _count: "desc" } },
      take: 10,
    }),
    prisma.relatorioCelula.findMany({
      where: { dataEncontro: { gte: inicio30d } },
      select: { presentes: true, visitantes: true, conversoes: true },
    }),
  ]);

  // Lookups
  const [redes, igrejas] = await Promise.all([
    prisma.rede.findMany({ select: { id: true, nome: true, cor: true } }),
    prisma.igreja.findMany({ select: { id: true, nome: true } }),
  ]);
  const redeNome = new Map(redes.map((r) => [r.id, r.nome] as const));
  const redeCor = new Map(redes.map((r) => [r.id, r.cor ?? "#94a3b8"] as const));
  const igrejaNome = new Map(igrejas.map((i) => [i.id, i.nome] as const));

  const totalPresentes30d = relatorios30d.reduce((s, r) => s + (r.presentes ?? 0), 0);
  const totalVisitantes30d = relatorios30d.reduce((s, r) => s + (r.visitantes ?? 0), 0);
  const totalConversoes30d = relatorios30d.reduce((s, r) => s + (r.conversoes ?? 0), 0);

  return (
    <ModuloShell
      titulo="Métricas de células"
      descricao="9 dimensões: estratégia, segmentação, comparecimento, adesão, demográfico, doações, supervisionamento, classificação, integração."
      stats={[
        { label: "Total", valor: total, ref: `${ativas} ativas · ${inativas} inativas` },
        { label: "Em multiplicação", valor: emMultiplicacao },
        { label: "Redes", valor: redes.length },
        { label: "Igrejas", valor: igrejas.length },
      ]}
    >
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Comparecimento (últimos 30 dias)
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Presentes</p>
            <p className="mt-1 text-3xl font-bold">{totalPresentes30d}</p>
            <p className="mt-1 text-xs text-muted-foreground">{relatorios30d.length} relatórios</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Visitantes</p>
            <p className="mt-1 text-3xl font-bold">{totalVisitantes30d}</p>
            <p className="mt-1 text-xs text-muted-foreground">via células</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Conversões</p>
            <p className="mt-1 text-3xl font-bold text-brand-orange">{totalConversoes30d}</p>
            <p className="mt-1 text-xs text-muted-foreground">decisões registradas</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Top 10 — maiores células ativas
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Rede</th>
                <th className="px-4 py-3">Igreja</th>
                <th className="px-4 py-3 text-right">Participantes</th>
              </tr>
            </thead>
            <tbody>
              {topPorParticipantes.map((c, i) => (
                <tr key={c.id} className="border-t border-border/40">
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{c.nome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.rede?.nome ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.igreja.nome}</td>
                  <td className="px-4 py-3 text-right font-mono">{c._count.participantes}</td>
                </tr>
              ))}
              {topPorParticipantes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Sem células ativas ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Distribuição por rede
          </h2>
          <div className="space-y-2">
            {porRede.map((r) => {
              const pct = (r._count._all / Math.max(1, total)) * 100;
              const cor = r.redeId ? redeCor.get(r.redeId) ?? "#94a3b8" : "#94a3b8";
              return (
                <div key={r.redeId ?? "none"} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{r.redeId ? redeNome.get(r.redeId) ?? "—" : "Sem rede"}</span>
                    <span className="font-mono text-muted-foreground">{r._count._all}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary/50">
                    <div className="h-full" style={{ width: `${pct}%`, background: cor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Distribuição por igreja
          </h2>
          <div className="space-y-2">
            {porIgreja.map((i) => {
              const pct = (i._count._all / Math.max(1, total)) * 100;
              return (
                <div key={i.igrejaId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{igrejaNome.get(i.igrejaId) ?? "—"}</span>
                    <span className="font-mono text-muted-foreground">{i._count._all}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary/50">
                    <div className="h-full bg-brand-orange/70" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Distribuição por dia da semana (células ativas)
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {DIAS.map((nome, dia) => {
            const stat = porDia.find((d) => d.diaSemana === dia);
            const qtd = stat?._count._all ?? 0;
            return (
              <div
                key={dia}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-3"
              >
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {nome.slice(0, 3)}
                </span>
                <span className="mt-1 text-2xl font-bold">{qtd}</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Inclui apenas células com <code>diaSemana</code> definido.
        </p>
      </section>
    </ModuloShell>
  );
}
