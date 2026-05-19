import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

const eventoInclude = {
  igreja: { select: { nome: true } },
  categoria: { select: { nome: true, cor: true } },
} as const;

type EventoCard = Awaited<
  ReturnType<
    typeof prisma.evento.findMany<{ include: typeof eventoInclude }>
  >
>[number];

function CardEvento({ e, passado = false }: { e: EventoCard; passado?: boolean }) {
  return (
    <Link
      key={e.id}
      href={`/eventos/${e.slug}`}
      className={`block rounded-2xl border bg-card p-5 transition hover:border-primary/40 hover:bg-secondary/30 ${
        passado ? "border-border/60 opacity-80" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs uppercase tracking-widest ${
            passado ? "text-muted-foreground" : "text-brand-orange"
          }`}
        >
          {dataPtBR(e.inicio)}
        </span>
        {e.categoria && (
          <span
            className="rounded-full px-2 py-0.5 text-xs"
            style={{ backgroundColor: (e.categoria.cor ?? "#888") + "33" }}
          >
            {e.categoria.nome}
          </span>
        )}
      </div>
      <h2 className="mt-2 text-lg font-semibold">{e.titulo}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{e.igreja.nome}</p>
      {e.local && (
        <p className="mt-2 text-xs text-muted-foreground">📍 {e.local}</p>
      )}
      {e.inscricoesAbertas && !passado && (
        <span className="mt-3 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
          Inscrições abertas
        </span>
      )}
    </Link>
  );
}

export default async function EventosPublicosPage() {
  const agora = new Date();

  const [proximos, recentes, totalRealizados] = await Promise.all([
    prisma.evento.findMany({
      where: { publicado: true, inicio: { gte: agora } },
      include: eventoInclude,
      orderBy: { inicio: "asc" },
      take: 50,
    }),
    prisma.evento.findMany({
      where: { publicado: true, inicio: { lt: agora } },
      include: eventoInclude,
      orderBy: { inicio: "desc" },
      take: 12,
    }),
    prisma.evento.count({
      where: { publicado: true, inicio: { lt: agora } },
    }),
  ]);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
          Agenda Maranata
        </p>
        <h1 className="mt-1 text-3xl font-bold">Eventos</h1>
        <p className="mt-1 text-muted-foreground">
          Celebrações, conferências e encontros nas 15 unidades.
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Próximos
        </h2>
        {proximos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-muted-foreground">
            Nenhum evento publicado no momento. Volte em breve.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proximos.map((e) => (
              <CardEvento key={e.id} e={e} />
            ))}
          </div>
        )}
      </section>

      {recentes.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Realizados recentemente
            </h2>
            {totalRealizados > recentes.length && (
              <span className="text-xs text-muted-foreground">
                {totalRealizados} no acervo
              </span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentes.map((e) => (
              <CardEvento key={e.id} e={e} passado />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
