import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { versiculoDoDia } from "@/lib/biblia";
import { dataPtBR } from "@/lib/utils";
import { BookMarked, Heart, HandHelping, Sparkles } from "lucide-react";
import { ReacaoBotao } from "./reacao-botao";

export const metadata = { title: "Devocional do dia" };
export const dynamic = "force-dynamic";

const TIPOS = [
  { value: "amem", label: "Amém", icon: Sparkles },
  { value: "abencoado", label: "Abençoou", icon: Heart },
  { value: "orei", label: "Orei", icon: HandHelping },
] as const;

export default async function DevocionalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/devocional");

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Devocional local (igreja do membro) tem precedência sobre geral.
  // Pega ambos e prefere local quando existir.
  const devocionais = await prisma.devocional.findMany({
    where: {
      data: hoje,
      publicado: true,
      OR: [
        { igrejaId: null }, // geral
        ...(user.igrejaId ? [{ igrejaId: user.igrejaId }] : []),
      ],
    },
    include: {
      reacoes: { select: { tipo: true, membroId: true } },
    },
  });
  const devocional =
    devocionais.find((d) => d.igrejaId !== null) ??
    devocionais.find((d) => d.igrejaId === null) ??
    null;

  const fallback = versiculoDoDia(hoje);

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });

  const minhasReacoes = new Set(
    devocional?.reacoes
      .filter((r) => r.membroId === membro?.id)
      .map((r) => r.tipo) ?? [],
  );

  const contagens = devocional
    ? TIPOS.reduce(
        (acc, t) => ({
          ...acc,
          [t.value]: devocional.reacoes.filter((r) => r.tipo === t.value).length,
        }),
        {} as Record<string, number>,
      )
    : {};

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-brand-orange to-brand-blue p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
          <BookMarked className="size-4" /> Devocional · {dataPtBR(hoje)}
        </div>
        {devocional ? (
          <>
            <h1 className="mt-3 text-2xl font-bold">{devocional.titulo}</h1>
            <p className="mt-3 text-base italic leading-relaxed opacity-90">
              «{devocional.versiculoTexto}»
            </p>
            <p className="mt-1 text-sm font-medium opacity-95">
              — {devocional.versiculoRef}
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl font-bold">Versículo de hoje</h1>
            <p className="mt-3 text-base italic leading-relaxed opacity-90">
              «{fallback.texto}»
            </p>
            <p className="mt-1 text-sm font-medium opacity-95">— {fallback.ref}</p>
            <Link
              href={`/membro/biblia/${fallback.slug}/${fallback.cap}#v${fallback.v}`}
              className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-white/30"
            >
              Ler em contexto →
            </Link>
          </>
        )}
      </header>

      {devocional && (
        <article className="prose prose-invert max-w-none whitespace-pre-wrap rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed">
          {devocional.texto}
          {devocional.autor && (
            <p className="mt-4 text-xs text-muted-foreground">— {devocional.autor}</p>
          )}
        </article>
      )}

      {devocional && membro && (
        <section className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          {TIPOS.map((t) => (
            <ReacaoBotao
              key={t.value}
              devocionalId={devocional.id}
              tipo={t.value}
              label={t.label}
              ativo={minhasReacoes.has(t.value)}
              contagem={contagens[t.value] ?? 0}
            />
          ))}
        </section>
      )}

      {!devocional && (
        <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Ainda não há devocional de hoje. A diretoria deve publicar até as 06h. Por enquanto,
          medite no versículo acima.
        </p>
      )}

      <Link
        href="/membro/biblia"
        className="block rounded-2xl border border-border bg-card p-4 text-sm font-medium hover:border-primary/40"
      >
        📖 Ir pra Bíblia
      </Link>
    </div>
  );
}
