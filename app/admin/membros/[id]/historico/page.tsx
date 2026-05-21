import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/empty-state";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Histórico do membro" };
export const dynamic = "force-dynamic";

type DiffJson = Record<string, unknown> | unknown[] | null | undefined;

function rotuloTipo(tipo: string): string {
  switch (tipo) {
    case "mudanca_igreja":
      return "Mudança de igreja";
    case "mudanca_status":
      return "Mudança de status";
    case "batismo":
      return "Batismo";
    case "transferencia":
      return "Transferência";
    case "criacao":
      return "Criação do cadastro";
    case "atualizacao":
      return "Atualização";
    default:
      return tipo;
  }
}

function formatDiff(diff: DiffJson): string {
  if (!diff || typeof diff !== "object") return "—";
  try {
    return JSON.stringify(diff, null, 2);
  } catch {
    return String(diff);
  }
}

export default async function HistoricoMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const membro = await prisma.membro.findUnique({
    where: { id },
    select: {
      id: true,
      nome: true,
      igreja: { select: { nome: true } },
    },
  });

  if (!membro) notFound();

  const historico = await prisma.historicoMembro.findMany({
    where: { membroId: id },
    orderBy: { criadoEm: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link
          href={`/admin/membros/${id}`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Voltar para o membro
        </Link>
        <h1 className="mt-2 text-3xl font-bold">{membro.nome}</h1>
        <p className="text-muted-foreground">
          Histórico de mudanças · {membro.igreja.nome}
        </p>
      </header>

      {historico.length === 0 ? (
        <EmptyState
          titulo="Nenhum evento registrado"
          descricao="Mudanças no cadastro do membro aparecerão aqui."
        />
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {historico.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[27px] top-1.5 flex size-3 rounded-full bg-primary/70 ring-4 ring-background" />
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{rotuloTipo(item.tipo)}</h3>
                  <time className="text-xs text-muted-foreground">
                    {dataPtBR(item.criadoEm)}
                  </time>
                </div>
                {item.observacao && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.observacao}
                  </p>
                )}
                <pre className="mt-3 overflow-x-auto rounded-xl bg-secondary/30 p-3 text-xs">
                  {formatDiff(item.diffJson as DiffJson)}
                </pre>
                {item.registradoPorId && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Registrado por: {item.registradoPorId}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
