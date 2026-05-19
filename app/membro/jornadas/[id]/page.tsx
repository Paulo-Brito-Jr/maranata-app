import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { InscreverBotao } from "./inscrever-botao";
import { ConcluirEtapaBotao } from "./concluir-etapa-botao";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await prisma.trilha.findUnique({ where: { id }, select: { titulo: true } });
  return { title: t?.titulo ?? "Trilha" };
}

export default async function MembroTrilhaDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redir=/membro/jornadas/${id}`);

  const trilha = await prisma.trilha.findUnique({
    where: { id },
    include: {
      etapas: { orderBy: { ordem: "asc" } },
    },
  });
  if (!trilha) notFound();

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });

  const inscricao = membro
    ? await prisma.pessoaJornada.findUnique({
        where: { trilhaId_membroId: { trilhaId: id, membroId: membro.id } },
        include: { progressos: { select: { etapaId: true } } },
      })
    : null;

  const concluidos = new Set(inscricao?.progressos.map((p) => p.etapaId) ?? []);
  const pct =
    trilha.etapas.length > 0
      ? Math.round((concluidos.size / trilha.etapas.length) * 100)
      : 0;

  // Próxima etapa pendente
  const proximaIndex = trilha.etapas.findIndex((e) => !concluidos.has(e.id));
  const podeAvancar = inscricao && trilha.etapas.length > 0;

  return (
    <div className="space-y-5">
      <Link
        href="/membro/jornadas"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Jornadas
      </Link>

      <header className="rounded-3xl bg-gradient-to-br from-brand-blue to-brand-orange p-6 text-white shadow-xl">
        <p className="text-xs uppercase tracking-widest opacity-80">
          Trilha {trilha.obrigatoria ? "obrigatória" : "opcional"}
        </p>
        <h1 className="mt-2 text-2xl font-bold">{trilha.titulo}</h1>
        {trilha.descricao && (
          <p className="mt-2 text-sm opacity-90">{trilha.descricao}</p>
        )}
        <p className="mt-3 text-xs opacity-80">
          {trilha.etapas.length} etapa(s)
          {inscricao && ` · ${concluidos.size}/${trilha.etapas.length} concluídas (${pct}%)`}
        </p>
        {inscricao && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </header>

      {!inscricao && trilha.etapas.length > 0 && membro && (
        <InscreverBotao trilhaId={id} />
      )}

      {!inscricao && trilha.etapas.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Trilha sem etapas ainda. Volte em breve.
        </p>
      )}

      {inscricao && inscricao.status === "CONCLUIDA" && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
          <p className="text-lg font-bold text-emerald-200">🎉 Trilha concluída!</p>
          <p className="mt-1 text-sm text-emerald-300">
            Em {inscricao.concluidaEm?.toLocaleDateString("pt-BR")}. Receba seu certificado.
          </p>
          <Link
            href={`/api/jornadas/${id}/certificado`}
            target="_blank"
            className="mt-3 inline-block rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950"
          >
            Baixar certificado
          </Link>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Etapas
        </h2>
        <ol className="space-y-2">
          {trilha.etapas.map((e, i) => {
            const concluida = concluidos.has(e.id);
            const ehProxima = podeAvancar && i === proximaIndex;
            const bloqueada = !inscricao || (!concluida && !ehProxima && i > proximaIndex);
            return (
              <li
                key={e.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 ${
                  concluida
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : ehProxima
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    concluida
                      ? "bg-emerald-500 text-emerald-950"
                      : ehProxima
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {concluida ? <Check className="size-4" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{e.titulo}</p>
                  {e.descricao && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{e.descricao}</p>
                  )}
                  {ehProxima && inscricao && (
                    <ConcluirEtapaBotao trilhaId={id} etapaId={e.id} />
                  )}
                  {bloqueada && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="size-3" /> conclua a etapa anterior pra desbloquear
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
