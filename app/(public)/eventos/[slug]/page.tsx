import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";

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

          <form
            action="/api/eventos/inscrever"
            method="POST"
            className="mt-4 space-y-3"
          >
            <input type="hidden" name="eventoId" value={evento.id} />
            <input
              type="text"
              name="nome"
              required
              placeholder="Seu nome"
              className="w-full rounded-xl border border-input bg-background px-3 py-2"
            />
            <input
              type="email"
              name="email"
              required
              placeholder="Seu e-mail"
              className="w-full rounded-xl border border-input bg-background px-3 py-2"
            />
            <input
              type="tel"
              name="telefone"
              placeholder="Telefone (opcional)"
              className="w-full rounded-xl border border-input bg-background px-3 py-2"
            />
            {evento.ingressos.length > 0 && (
              <select
                name="ingressoId"
                required
                className="w-full rounded-xl border border-input bg-background px-3 py-2"
              >
                <option value="">Tipo de inscrição...</option>
                {evento.ingressos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome} — R$ {Number(i.preco).toFixed(2)}
                  </option>
                ))}
              </select>
            )}
            <button className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground hover:opacity-90">
              Inscrever
            </button>
          </form>
        </section>
      ) : (
        <p className="rounded-2xl border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Inscrições não disponíveis para este evento.
        </p>
      )}
    </div>
  );
}
