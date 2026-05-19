import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Sparkles, Map } from "lucide-react";

export const metadata = { title: "Jornadas" };
export const dynamic = "force-dynamic";

export default async function JornadasMembroPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/jornadas");

  const trilhas = await prisma.trilha.findMany({
    where: { ativa: true },
    orderBy: { titulo: "asc" },
    include: { _count: { select: { etapas: true } } },
    take: 20,
  });

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });

  const minhas = membro
    ? await prisma.pessoaJornada.findMany({
        where: { membroId: membro.id },
        include: { trilha: { select: { titulo: true, id: true } } },
      })
    : [];

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-brand-blue to-brand-orange p-6 text-white shadow-xl">
        <Map className="size-8" />
        <h1 className="mt-3 text-2xl font-bold">Jornadas</h1>
        <p className="mt-1 text-sm opacity-90">
          Trilhas de discipulado pra cada estação da sua vida com Deus.
        </p>
      </header>

      {minhas.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Suas trilhas
          </h2>
          <ul className="space-y-2">
            {minhas.map((j) => (
              <li
                key={j.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium">{j.trilha.titulo}</p>
                  <p className="text-xs text-muted-foreground">{j.status}</p>
                </div>
                <span className="text-primary">→</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Disponíveis
        </h2>
        {trilhas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto size-6 text-primary" />
            <p className="mt-2">Nenhuma trilha publicada ainda.</p>
            <p className="mt-1 text-xs">
              Em breve (F-P8): inscrição, progresso visual e certificado de conclusão.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {trilhas.map((t) => (
              <li
                key={t.id}
                className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-secondary/40"
              >
                <p className="font-medium">{t.titulo}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t._count.etapas} etapa(s){t.obrigatoria ? " · obrigatória" : ""}
                </p>
                {t.descricao && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {t.descricao}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Quer ver as suas estatísticas?{" "}
        <Link href="/membro/historico" className="text-primary underline">
          ir pro histórico
        </Link>
      </p>
    </div>
  );
}
