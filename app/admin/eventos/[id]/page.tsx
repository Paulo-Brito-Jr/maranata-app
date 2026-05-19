import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Evento" };

export default async function EventoDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evento = await prisma.evento.findUnique({
    where: { id },
    include: {
      igreja: { select: { nome: true } },
      categoria: { select: { nome: true } },
      inscricoes: { orderBy: { criadoEm: "desc" }, take: 20 },
      _count: { select: { inscricoes: true } },
    },
  });

  if (!evento) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://maranata.app";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/eventos" className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar
        </Link>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{evento.titulo}</h1>
            <p className="text-muted-foreground">
              {dataPtBR(evento.inicio)} · {evento.igreja.nome}
              {evento.categoria && ` · ${evento.categoria.nome}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/eventos/${id}/checkin`}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Check-in ao vivo
            </Link>
            <Link
              href={`/admin/eventos/${id}/checkin/manual`}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
            >
              Lista manual
            </Link>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Página pública
        </h2>
        <code className="block break-all rounded-xl bg-muted px-3 py-2 text-sm">
          {appUrl}/eventos/{evento.slug}
        </code>
      </div>

      {evento.descricao && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p>{evento.descricao}</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Inscrições ({evento._count.inscricoes})
        </h2>
        {evento.inscricoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem inscrições ainda.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {evento.inscricoes.map((i) => (
              <li key={i.id} className="flex items-center justify-between">
                <span>{i.nomeAvulso ?? "Membro"}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                  {i.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
