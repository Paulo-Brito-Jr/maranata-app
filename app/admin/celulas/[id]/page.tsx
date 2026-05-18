import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Célula" };

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function CelulaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const celula = await prisma.celula.findUnique({
    where: { id },
    include: {
      igreja: { select: { nome: true } },
      rede: { select: { nome: true } },
      participantes: { include: { membro: { select: { id: true, nome: true } } }, where: { ativo: true } },
      lideres: { include: { membro: { select: { id: true, nome: true } } } },
      relatorios: { orderBy: { dataEncontro: "desc" }, take: 10 },
    },
  });

  if (!celula) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/celulas" className="text-sm text-muted-foreground hover:text-primary">
          ← Voltar
        </Link>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{celula.nome}</h1>
            <p className="text-muted-foreground">
              {celula.igreja.nome}
              {celula.rede && ` · ${celula.rede.nome}`}
            </p>
          </div>
          <Link
            href={`/admin/celulas/${id}/editar`}
            className="rounded-full border border-border bg-card px-5 py-2 text-sm hover:bg-secondary"
          >
            Editar
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Encontros
          </h2>
          <p className="mt-2 text-lg">
            {celula.diaSemana != null ? DIAS[celula.diaSemana] : "—"}{" "}
            {celula.horario && <span>· {celula.horario}</span>}
          </p>
          {celula.endereco && (
            <p className="mt-1 text-sm text-muted-foreground">
              {celula.endereco}
              {celula.cidade && `, ${celula.cidade}`}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Liderança
          </h2>
          {celula.lideres.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm">
              {celula.lideres.map((l) => (
                <li key={l.id}>
                  <span className="font-medium">{l.membro.nome}</span>{" "}
                  <span className="text-muted-foreground">— {l.papel}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sem líderes definidos.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Participantes ({celula.participantes.length})
        </h2>
        {celula.participantes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sem participantes.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {celula.participantes.map((p) => (
              <Link
                key={p.id}
                href={`/admin/membros/${p.membro.id}`}
                className="rounded-full bg-secondary px-3 py-1 text-xs hover:bg-primary/10"
              >
                {p.membro.nome}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
