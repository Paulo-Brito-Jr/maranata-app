import { prisma } from "@/lib/prisma";
import { CompartilharTestemunho } from "./compartilhar-form";

export const metadata = { title: "Testemunhos" };
export const dynamic = "force-dynamic";

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

export default async function MembroTestemunhos() {
  const testemunhos = await prisma.testemunho.findMany({
    where: { publicado: true },
    include: { membro: { select: { nome: true } } },
    orderBy: [{ destaque: "desc" }, { criadoEm: "desc" }],
    take: 30,
  });

  const nomeDe = (t: {
    nomeAvulso: string | null;
    membro: { nome: string } | null;
  }) => t.membro?.nome ?? t.nomeAvulso ?? "Família Maranata";

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-brand-orange">
          O que Deus tem feito
        </p>
        <h1 className="mt-1 text-2xl font-bold">Testemunhos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vidas tocadas pela graça nas 14 unidades.
        </p>
      </header>

      <CompartilharTestemunho />

      {testemunhos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Ainda não há testemunhos publicados. Compartilhe o seu acima!
        </div>
      ) : (
        <div className="space-y-3">
          {testemunhos.map((t) => (
            <article
              key={t.id}
              className={`rounded-2xl border bg-card p-4 ${
                t.destaque
                  ? "border-brand-orange/40 shadow shadow-brand-orange/10"
                  : "border-border"
              }`}
            >
              {t.destaque && (
                <span className="inline-block rounded-full bg-brand-orange/20 px-2 py-0.5 text-xs uppercase tracking-widest text-brand-orange">
                  Destaque
                </span>
              )}
              <p className="mt-2 text-sm leading-relaxed">{t.texto}</p>
              <footer className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {iniciais(nomeDe(t))}
                </span>
                <div>
                  <p className="font-medium text-foreground">{nomeDe(t)}</p>
                  <p>{dataCurta(t.criadoEm)}</p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
