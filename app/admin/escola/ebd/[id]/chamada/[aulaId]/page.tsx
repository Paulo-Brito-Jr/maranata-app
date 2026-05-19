import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { dataPtBR } from "@/lib/utils";
import { marcarPresencaEbd, salvarChamadaEbd } from "./actions";

export const metadata = { title: "Chamada EBD" };
export const dynamic = "force-dynamic";

export default async function ChamadaPage({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>;
}) {
  const { id, aulaId } = await params;

  const aula = await prisma.ebdAula.findUnique({
    where: { id: aulaId },
    include: {
      classe: { select: { id: true, nome: true, ciclo: true } },
      presencas: { select: { inscricaoId: true, presente: true } },
    },
  });
  if (!aula || aula.classe.id !== id) notFound();

  const inscricoes = await prisma.ebdInscricao.findMany({
    where: { classeId: id, ciclo: aula.classe.ciclo, status: "ATIVA" },
    include: { membro: { select: { nome: true } } },
    orderBy: { membro: { nome: "asc" } },
  });

  const presencasMap = new Map(aula.presencas.map((p) => [p.inscricaoId, p.presente]));

  return (
    <ModuloShell
      titulo={`Chamada · ${aula.titulo}`}
      descricao={`${aula.classe.nome} · ${dataPtBR(aula.data)}`}
      stats={[
        { label: "Inscritos", valor: inscricoes.length },
        {
          label: "Marcados",
          valor: aula.presencas.length,
        },
        {
          label: "Presentes",
          valor: aula.presencas.filter((p) => p.presente).length,
        },
      ]}
      acoes={[{ href: `/admin/escola/ebd/${id}`, label: "← Classe" }]}
    >
      <form action={salvarChamadaEbd.bind(null, aulaId)} className="space-y-3">
        {inscricoes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            Nenhum aluno inscrito nesta classe pra este ciclo.
          </p>
        ) : (
          <ul className="space-y-1">
            {inscricoes.map((i) => {
              const presente = presencasMap.get(i.id) ?? false;
              return (
                <li key={i.id}>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2 hover:border-primary/40">
                    <span className="font-medium">{i.membro.nome}</span>
                    <div className="flex gap-2">
                      <input
                        type="hidden"
                        name={`status_${i.id}`}
                        value={presente ? "1" : "0"}
                      />
                      <label className="inline-flex items-center gap-1 text-xs">
                        <input
                          type="radio"
                          name={`p_${i.id}`}
                          value="1"
                          defaultChecked={presente}
                        />
                        Presente
                      </label>
                      <label className="inline-flex items-center gap-1 text-xs">
                        <input
                          type="radio"
                          name={`p_${i.id}`}
                          value="0"
                          defaultChecked={!presente && aula.presencas.some((p) => p.inscricaoId === i.id)}
                        />
                        Falta
                      </label>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {inscricoes.length > 0 && (
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Salvar chamada
          </button>
        )}
      </form>

      <Link
        href={`/admin/escola/ebd/${id}`}
        className="block text-center text-xs text-muted-foreground hover:text-foreground"
      >
        ← Voltar
      </Link>
    </ModuloShell>
  );
}

// Mantém referência pra Server Action (mesmo arquivo importa actions abaixo)
void marcarPresencaEbd;
