import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { brl, dataPtBR } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Campanhas" };
export const dynamic = "force-dynamic";

export default async function CampanhasPage() {
  const campanhas = await prisma.campanha.findMany({
    include: { igreja: { select: { nome: true } } },
    orderBy: { criadaEm: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/financeiro" className="text-sm text-muted-foreground hover:text-primary">
            ← Voltar
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Campanhas</h1>
          <p className="text-muted-foreground">Doações com meta e prazo.</p>
        </div>
        <Link
          href="/admin/financeiro/campanhas/nova"
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Nova campanha
        </Link>
      </header>

      {campanhas.length === 0 ? (
        <EmptyState
          titulo="Nenhuma campanha"
          descricao="Crie sua primeira campanha pra arrecadação focada."
          acao={{ href: "/admin/financeiro/campanhas/nova", label: "Nova campanha" }}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {campanhas.map((c) => {
            const arrecadado = Number(c.arrecadado);
            const meta = c.meta ? Number(c.meta) : null;
            const pct = meta ? Math.min(100, (arrecadado / meta) * 100) : null;
            return (
              <Link
                key={c.id}
                href={`/admin/financeiro/campanhas/${c.id}`}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{c.titulo}</h3>
                  {c.ativa && (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">
                      Ativa
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{brl(arrecadado)}</span>
                  {meta && (
                    <span className="text-xs text-muted-foreground">de {brl(meta)}</span>
                  )}
                </div>
                {pct != null && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  /{c.slug}
                  {c.fim && ` · até ${dataPtBR(c.fim)}`}
                  {c.igreja && ` · ${c.igreja.nome}`}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
