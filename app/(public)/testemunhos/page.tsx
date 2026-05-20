import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const metadata = { title: "Testemunhos" };
export const dynamic = "force-dynamic";

async function flagAtiva(chave: string): Promise<boolean> {
  const f = await prisma.featureFlag.findUnique({ where: { chave } });
  return Boolean(f?.habilitada);
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function dataCurta(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function TestemunhosPublicosPage() {
  if (!(await flagAtiva("public_testimony"))) notFound();
  const [destaques, recentes, total] = await Promise.all([
    prisma.testemunho.findMany({
      where: { publicado: true, destaque: true },
      include: { membro: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 3,
    }),
    prisma.testemunho.findMany({
      where: { publicado: true, destaque: false },
      include: { membro: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 30,
    }),
    prisma.testemunho.count({ where: { publicado: true } }),
  ]);

  const nomeDe = (t: {
    nomeAvulso: string | null;
    membro: { nome: string } | null;
  }): string => t.membro?.nome ?? t.nomeAvulso ?? "Família Maranata";

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
          O que Deus tem feito
        </p>
        <h1 className="mt-1 text-3xl font-bold">Testemunhos da família Maranata</h1>
        <p className="mt-1 text-muted-foreground">
          {total > 0
            ? `${total} testemunhos publicados pelas 15 unidades.`
            : "Vidas transformadas por Cristo nas 15 unidades."}
        </p>
      </header>

      {destaques.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
          {destaques.map((t) => (
            <article
              key={t.id}
              className="rounded-3xl border border-brand-orange/30 bg-card p-6 shadow-lg shadow-brand-orange/10"
            >
              <span className="inline-block rounded-full bg-brand-orange/20 px-3 py-0.5 text-xs uppercase tracking-widest text-brand-orange">
                Destaque
              </span>
              <p className="mt-4 line-clamp-[10] text-sm leading-relaxed">
                {t.texto}
              </p>
              <footer className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                  {iniciais(nomeDe(t))}
                </span>
                <div>
                  <p className="font-medium text-foreground">{nomeDe(t)}</p>
                  <p>{dataCurta(t.criadoEm)}</p>
                </div>
              </footer>
            </article>
          ))}
        </section>
      )}

      {recentes.length === 0 && destaques.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          Ainda não há testemunhos publicados. Volte em breve.
        </div>
      ) : (
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Mais testemunhos
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {recentes.map((t) => (
              <article
                key={t.id}
                className="rounded-2xl border border-border bg-card/60 p-5 transition hover:border-primary/40"
              >
                <p className="line-clamp-6 text-sm leading-relaxed">{t.texto}</p>
                <footer className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{nomeDe(t)}</span>
                  <span>{dataCurta(t.criadoEm)}</span>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
