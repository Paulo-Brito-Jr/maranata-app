import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";
import { InscricaoForm } from "./inscricao-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = await prisma.evento.findUnique({ where: { slug }, select: { titulo: true } });
  return { title: e?.titulo ?? "Evento" };
}

export default async function EventoPublicoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const evento = await prisma.evento.findUnique({
    where: { slug },
    include: {
      igreja: { select: { nome: true } },
      categoria: { select: { nome: true } },
      lotes: { where: { ativo: true }, orderBy: { inicio: "asc" } },
      ingressos: { where: { ativo: true } },
    },
  });

  if (!evento || !evento.publicado) notFound();

  const igrejas = await prisma.igreja.findMany({
    where: { ativa: true },
    orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
    select: { id: true, nome: true, apelido: true, endereco: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/eventos" className="text-sm text-muted-foreground hover:text-primary">
        ← Voltar
      </Link>

      <header>
        <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
          {evento.categoria?.nome ?? evento.igreja.nome}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{evento.titulo}</h1>
        <p className="mt-2 text-muted-foreground">
          📅 {dataPtBR(evento.inicio)}
          {evento.fim && ` · até ${dataPtBR(evento.fim)}`}
        </p>
        {evento.local && (
          <p className="text-muted-foreground">
            📍 {evento.local}
            {evento.endereco && ` · ${evento.endereco}`}
          </p>
        )}
      </header>

      {evento.descricao && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="whitespace-pre-line">{evento.descricao}</p>
        </div>
      )}

      {evento.inscricoesAbertas ? (
        <section className="rounded-3xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold">Inscrições abertas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Garanta sua participação preenchendo os dados abaixo.
          </p>

          <InscricaoForm
            eventoId={evento.id}
            ingressos={evento.ingressos.map((i) => ({
              id: i.id,
              nome: i.nome,
              preco: Number(i.preco),
            }))}
            igrejas={igrejas}
          />
        </section>
      ) : (
        <p className="rounded-2xl border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Inscrições não disponíveis para este evento.
        </p>
      )}
    </div>
  );
}
