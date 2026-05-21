import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Eventos" };
export const dynamic = "force-dynamic";

export default async function MembroEventos() {
  const agora = new Date();
  const user = await getCurrentUser();
  // Membro vê: eventos gerais (ehGeral=true, organizados pela Sede) + eventos
  // da sua congregação local (igrejaId do JWT). Sem JWT vê só os publicados.
  const filtroIgreja = user?.igrejaId
    ? { OR: [{ ehGeral: true }, { igrejaId: user.igrejaId }] }
    : {};

  const eventos = await prisma.evento.findMany({
    where: { publicado: true, inicio: { gte: agora }, ...filtroIgreja },
    include: {
      igreja: { select: { nome: true } },
      categoria: { select: { nome: true, cor: true } },
      localEvento: { select: { nome: true, tipo: true } },
    },
    orderBy: { inicio: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-brand-orange">
          Agenda
        </p>
        <h1 className="mt-1 text-2xl font-bold">Próximos eventos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          As celebrações e encontros nas 14 unidades.
        </p>
      </header>

      {eventos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum evento publicado. Volte em breve.
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map((e) => (
            <Link
              key={e.id}
              href={`/eventos/${e.slug}`}
              className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-secondary/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-brand-orange">
                  {dataPtBR(e.inicio)}
                </span>
                {e.categoria && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: (e.categoria.cor ?? "#888") + "33",
                    }}
                  >
                    {e.categoria.nome}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-base font-semibold leading-tight">
                {e.titulo}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{e.igreja.nome}</span>
                {e.ehGeral && (
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-blue-700 dark:text-blue-300">
                    Geral
                  </span>
                )}
                {e.localEvento && e.localEvento.tipo === "ACAMPAMENTO" && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                    🏕️ Acampamento
                  </span>
                )}
              </p>
              {e.local && (
                <p className="mt-1 text-xs text-muted-foreground">📍 {e.local}</p>
              )}
              {e.inscricoesAbertas && (
                <span className="mt-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                  Inscrições abertas
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
