import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Select, Button } from "@/components/ui/field";
import { dataPtBR } from "@/lib/utils";
import {
  matricularAluno,
  criarAulaIbm,
  criarAvaliacao,
  lancarNota,
  togglePresenca,
  encerrarTurma,
} from "./actions";

export const dynamic = "force-dynamic";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await prisma.ibmTurma.findUnique({
    where: { id },
    select: { disciplina: { select: { codigo: true, nome: true } }, semestre: true },
  });
  return { title: t ? `${t.disciplina.codigo} · ${t.semestre}` : "Turma" };
}

export default async function TurmaDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const turma = await prisma.ibmTurma.findUnique({
    where: { id },
    include: {
      disciplina: { include: { curso: { select: { nome: true, id: true } } } },
      professor: { select: { nome: true } },
      matriculas: {
        include: {
          aluno: { select: { id: true, nome: true } },
          notas: { include: { avaliacao: { select: { titulo: true, peso: true, notaMax: true } } } },
          presencas: { select: { presente: true } },
        },
        orderBy: { aluno: { nome: "asc" } },
      },
      aulas: {
        orderBy: { data: "desc" },
        include: {
          presencas: { include: { matricula: { select: { aluno: { select: { nome: true } } } } } },
        },
      },
      avaliacoes: { orderBy: { criadaEm: "asc" } },
    },
  });
  if (!turma) notFound();

  const membrosDisponiveis = await prisma.membro.findMany({
    where: {
      status: "ATIVO",
      NOT: { ibmTurmaMatriculas: { some: { turmaId: id } } },
    },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
    take: 500,
  });

  return (
    <ModuloShell
      titulo={`${turma.disciplina.codigo} · ${turma.disciplina.nome}`}
      descricao={`${turma.disciplina.curso.nome} · ${turma.semestre} · ${DIAS[turma.diaSemana]} ${turma.horario}${turma.sala ? ` · ${turma.sala}` : ""}${turma.professor ? ` · Prof. ${turma.professor.nome}` : ""}`}
      stats={[
        { label: "Matriculados", valor: `${turma.matriculas.length}/${turma.vagas}` },
        { label: "Aulas", valor: turma.aulas.length },
        { label: "Avaliações", valor: turma.avaliacoes.length },
        { label: "Status", valor: turma.status },
      ]}
      acoes={[
        { href: `/admin/escola/ibm/disciplinas/${turma.disciplinaId}`, label: "← Disciplina" },
      ]}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Matricular aluno</h2>
          <form action={matricularAluno} className="space-y-3">
            <input type="hidden" name="turmaId" value={id} />
            <Field label="Membro" required>
              <Select name="alunoId" required>
                <option value="">Selecione</option>
                {membrosDisponiveis.slice(0, 200).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Matricular</Button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Nova aula</h2>
          <form action={criarAulaIbm} className="space-y-3">
            <input type="hidden" name="turmaId" value={id} />
            <Field label="Data" required>
              <Input type="date" name="data" required defaultValue={hojeStr()} />
            </Field>
            <Field label="Conteúdo">
              <Input name="conteudo" />
            </Field>
            <Button type="submit">Criar aula</Button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Nova avaliação</h2>
          <form action={criarAvaliacao} className="space-y-3">
            <input type="hidden" name="turmaId" value={id} />
            <Field label="Tipo" required>
              <Select name="tipo" required defaultValue="PROVA">
                <option value="PROVA">Prova</option>
                <option value="TRABALHO">Trabalho</option>
                <option value="SEMINARIO">Seminário</option>
                <option value="PROJETO">Projeto</option>
                <option value="PARTICIPACAO">Participação</option>
                <option value="OUTRO">Outro</option>
              </Select>
            </Field>
            <Field label="Título" required>
              <Input name="titulo" required maxLength={120} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Peso">
                <Input type="number" step="0.1" name="peso" defaultValue="1.0" />
              </Field>
              <Field label="Nota máx">
                <Input type="number" step="0.1" name="notaMax" defaultValue="10.0" />
              </Field>
            </div>
            <Field label="Entrega (opcional)">
              <Input type="date" name="dataEntrega" />
            </Field>
            <Button type="submit">Criar</Button>
          </form>
        </div>
      </section>

      {turma.matriculas.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Diário ({turma.matriculas.length} alunos)
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Aluno</th>
                  <th className="px-3 py-2 text-center">Faltas</th>
                  <th className="px-3 py-2 text-center">Média</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {turma.matriculas.map((m) => {
                  const totalFaltas = m.presencas.filter((p) => !p.presente).length;
                  let mediaCalc: number | null = null;
                  let totalPeso = 0;
                  let somaPond = 0;
                  for (const n of m.notas) {
                    const peso = Number(n.avaliacao.peso);
                    totalPeso += peso;
                    somaPond += (Number(n.valor) / Number(n.avaliacao.notaMax)) * 10 * peso;
                  }
                  if (totalPeso > 0) mediaCalc = somaPond / totalPeso;
                  return (
                    <tr key={m.id}>
                      <td className="px-3 py-2 font-medium">
                        <Link
                          href={`#aluno-${m.id}`}
                          className="hover:text-primary"
                        >
                          {m.aluno.nome}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-center">{totalFaltas}</td>
                      <td className="px-3 py-2 text-center">
                        {mediaCalc !== null ? mediaCalc.toFixed(1) : "—"}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        <span
                          className={`rounded-full px-2 py-0.5 ${
                            m.status === "APROVADO"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : m.status === "REPROVADO"
                                ? "bg-red-500/15 text-red-300"
                                : "bg-secondary/60 text-muted-foreground"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {turma.avaliacoes.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Lançar notas
          </h2>
          {turma.avaliacoes.map((av) => (
            <details key={av.id} className="rounded-2xl border border-border bg-card p-4 mb-2">
              <summary className="cursor-pointer font-medium">
                {av.tipo} · {av.titulo}{" "}
                <span className="text-xs text-muted-foreground">
                  peso {String(av.peso)} · máx {String(av.notaMax)}
                </span>
              </summary>
              <ul className="mt-3 space-y-1">
                {turma.matriculas.map((m) => {
                  const nota = m.notas.find((n) => n.avaliacaoId === av.id);
                  return (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{m.aluno.nome}</span>
                      <form action={lancarNota} className="flex gap-2">
                        <input type="hidden" name="matriculaId" value={m.id} />
                        <input type="hidden" name="avaliacaoId" value={av.id} />
                        <input type="hidden" name="turmaId" value={id} />
                        <input
                          type="number"
                          step="0.1"
                          name="valor"
                          defaultValue={nota ? String(nota.valor) : ""}
                          max={Number(av.notaMax)}
                          min={0}
                          className="w-20 rounded-lg border border-input bg-background px-2 py-1 text-center text-sm"
                          placeholder="—"
                        />
                        <button className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                          Salvar
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </section>
      )}

      {turma.aulas.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Presenças
          </h2>
          {turma.aulas.slice(0, 6).map((a) => {
            const presMap = new Map(
              a.presencas.map((p) => [p.matricula.aluno.nome, p.presente]),
            );
            return (
              <details key={a.id} className="rounded-2xl border border-border bg-card p-4 mb-2">
                <summary className="cursor-pointer font-medium">
                  {dataPtBR(a.data)}{" "}
                  <span className="text-xs text-muted-foreground">
                    {a.conteudo ?? "—"}
                  </span>
                </summary>
                <ul className="mt-3 space-y-1">
                  {turma.matriculas.map((m) => {
                    const presente = presMap.get(m.aluno.nome);
                    return (
                      <li key={m.id} className="flex items-center justify-between text-sm">
                        <span>{m.aluno.nome}</span>
                        <form action={togglePresenca} className="flex gap-2">
                          <input type="hidden" name="aulaId" value={a.id} />
                          <input type="hidden" name="matriculaId" value={m.id} />
                          <input type="hidden" name="turmaId" value={id} />
                          <button
                            name="acao"
                            value="presente"
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              presente === true
                                ? "bg-emerald-500/30 text-emerald-200"
                                : "bg-secondary/40 hover:bg-secondary/70"
                            }`}
                          >
                            ✓
                          </button>
                          <button
                            name="acao"
                            value="falta"
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              presente === false
                                ? "bg-red-500/30 text-red-200"
                                : "bg-secondary/40 hover:bg-secondary/70"
                            }`}
                          >
                            ✗
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </section>
      )}

      {turma.status !== "ENCERRADA" && turma.matriculas.length > 0 && (
        <form action={encerrarTurma} className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
          <input type="hidden" name="turmaId" value={id} />
          <h2 className="font-medium text-amber-200">Encerrar turma</h2>
          <p className="mt-1 text-xs text-amber-300/80">
            Calcula a média final de cada aluno e atualiza status (APROVADO/REPROVADO). Use só
            no fim do semestre.
          </p>
          <button className="mt-3 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950">
            Encerrar e calcular médias
          </button>
        </form>
      )}
    </ModuloShell>
  );
}

function hojeStr(): string {
  return new Date().toISOString().slice(0, 10);
}
