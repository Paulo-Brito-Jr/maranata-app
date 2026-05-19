import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { brl } from "@/lib/utils";
import { HandCoins, Sparkles } from "lucide-react";

export const metadata = {
  title: "Transparência financeira · Maranata",
  description: "Como Deus tem provido para a obra da IME Maranata.",
};
export const dynamic = "force-dynamic";

export default async function TransparenciaPage() {
  const ano = new Date().getFullYear();
  const inicio = new Date(ano, 0, 1);
  const fim = new Date(ano + 1, 0, 1);

  const [campanhas, doacoes, totalArrecadadoAno] = await Promise.all([
    prisma.campanha.findMany({
      where: { ativa: true },
      include: { _count: { select: { doacoes: { where: { status: "PAGA" } } } } },
      orderBy: { criadaEm: "desc" },
    }),
    prisma.doacao.aggregate({
      _sum: { valor: true },
      _count: true,
      where: { status: "PAGA", pagaEm: { gte: inicio, lt: fim } },
    }),
    prisma.lancamentoFinanceiro.aggregate({
      _sum: { valor: true },
      where: { tipo: "ENTRADA", data: { gte: inicio, lt: fim } },
    }),
  ]);

  const totalDoacoes = Number(doacoes._sum.valor ?? 0);
  const totalEntrada = Number(totalArrecadadoAno._sum.valor ?? 0);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          IME Maranata · {ano}
        </p>
        <h1 className="mt-2 text-3xl font-bold">Transparência financeira</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          «Tudo vem das tuas mãos, e das tuas mãos te demos.» — 1 Crônicas 29.14
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <HandCoins className="size-6 text-primary" />
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
            Doações pagas em {ano}
          </p>
          <p className="mt-1 text-3xl font-bold">{brl(totalDoacoes)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {doacoes._count} contribuição(ões)
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <Sparkles className="size-6 text-primary" />
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
            Entradas totais (todas as fontes)
          </p>
          <p className="mt-1 text-3xl font-bold">{brl(totalEntrada)}</p>
          <p className="mt-1 text-xs text-muted-foreground">dízimos, ofertas, eventos, loja</p>
        </div>
      </section>

      {campanhas.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Campanhas
          </h2>
          <ul className="space-y-3">
            {campanhas.map((c) => {
              const arrec = Number(c.arrecadado);
              const meta = c.meta ? Number(c.meta) : null;
              const pct = meta && meta > 0 ? Math.min(100, Math.round((arrec / meta) * 100)) : null;
              return (
                <li
                  key={c.id}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{c.titulo}</p>
                      {c.descricao && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {c.descricao}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/doar/${c.slug}`}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      Contribuir
                    </Link>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span>
                      <strong className="text-foreground">{brl(arrec)}</strong>
                      {meta && <span className="text-muted-foreground"> de {brl(meta)}</span>}
                    </span>
                    <span className="text-muted-foreground">
                      {c._count.doacoes} contribuintes
                    </span>
                  </div>
                  {pct !== null && (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <footer className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-center text-xs text-muted-foreground">
        Dados consolidados em tempo real. Os relatórios completos por categoria estão disponíveis
        com a tesouraria da igreja.{" "}
        <Link href="/doar" className="text-primary underline">
          Faça sua contribuição
        </Link>
      </footer>
    </main>
  );
}
