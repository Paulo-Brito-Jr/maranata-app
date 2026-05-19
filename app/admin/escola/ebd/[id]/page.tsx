import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { dataPtBR } from "@/lib/utils";
import { inscreverEmClasse, criarAulaEbd } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.ebdClasse.findUnique({ where: { id }, select: { nome: true } });
  return { title: c?.nome ?? "Classe EBD" };
}

export default async function ClasseDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classe = await prisma.ebdClasse.findUnique({
    where: { id },
    include: {
      igreja: { select: { nome: true } },
      inscricoes: {
        where: { status: "ATIVA" },
        include: { membro: { select: { id: true, nome: true } } },
        orderBy: { inscritoEm: "asc" },
      },
      aulas: { orderBy: { data: "desc" }, include: { _count: { select: { presencas: true } } } },
    },
  });
  if (!classe) notFound();

  const membrosDisponiveis = await prisma.membro.findMany({
    where: {
      igrejaId: classe.igrejaId,
      status: "ATIVO",
      NOT: {
        ebdInscricoes: {
          some: { classeId: id, ciclo: classe.ciclo, status: "ATIVA" },
        },
      },
    },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
    take: 500,
  });

  return (
    <ModuloShell
      titulo={classe.nome}
      descricao={`${classe.igreja.nome} · ${classe.faixa} · ciclo ${classe.ciclo}${classe.sala ? ` · sala ${classe.sala}` : ""}`}
      stats={[
        { label: "Inscritos", valor: classe.inscricoes.length },
        { label: "Aulas dadas", valor: classe.aulas.length },
        { label: "Capacidade", valor: classe.capacidade ?? "—" },
      ]}
      acoes={[{ href: "/admin/escola/ebd", label: "← Classes" }]}
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Inscrever aluno</h2>
          <form action={inscreverEmClasse} className="space-y-3">
            <input type="hidden" name="classeId" value={id} />
            <input type="hidden" name="ciclo" value={classe.ciclo} />
            <Field label="Membro" required>
              <Select name="membroId" required>
                <option value="">Selecione um membro</option>
                {membrosDisponiveis.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Inscrever</Button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Nova aula</h2>
          <form action={criarAulaEbd} className="space-y-3">
            <input type="hidden" name="classeId" value={id} />
            <Field label="Data" required>
              <Input type="date" name="data" required defaultValue={dataInput()} />
            </Field>
            <Field label="Título da lição" required>
              <Input name="titulo" required placeholder="Lição 5 — Romanos 8" />
            </Field>
            <Field label="Resumo">
              <Textarea name="resumo" rows={2} />
            </Field>
            <Button type="submit">Criar aula</Button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Alunos inscritos ({classe.inscricoes.length})
        </h2>
        {classe.inscricoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem inscritos ainda.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {classe.inscricoes.map((i) => (
              <li
                key={i.id}
                className="rounded-2xl border border-border bg-card p-3 text-sm"
              >
                <span className="font-medium">{i.membro.nome}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  desde {dataPtBR(i.inscritoEm)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Aulas ({classe.aulas.length})
        </h2>
        {classe.aulas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem aulas ainda. Crie a primeira acima.</p>
        ) : (
          <ul className="space-y-2">
            {classe.aulas.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {dataPtBR(a.data)} · {a._count.presencas} chamada(s) feitas
                  </p>
                </div>
                <Link
                  href={`/admin/escola/ebd/${id}/chamada/${a.id}`}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  fazer chamada
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}

function dataInput(): string {
  return new Date().toISOString().slice(0, 10);
}
