import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Button } from "@/components/ui/field";
import { atualizarTurmaIbm, excluirTurmaIbm } from "../actions";

export const metadata = { title: "Editar turma IBM" };
export const dynamic = "force-dynamic";

const DIAS = [
  { v: 0, l: "Domingo" },
  { v: 1, l: "Segunda" },
  { v: 2, l: "Terça" },
  { v: 3, l: "Quarta" },
  { v: 4, l: "Quinta" },
  { v: 5, l: "Sexta" },
  { v: 6, l: "Sábado" },
];

export default async function EditarTurmaIbmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [turma, professores, igrejas] = await Promise.all([
    prisma.ibmTurma.findUnique({
      where: { id },
      include: { disciplina: { select: { codigo: true, nome: true } } },
    }),
    prisma.ibmProfessor.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!turma) notFound();

  const atualizarComId = atualizarTurmaIbm.bind(null, id);
  const excluirComId = excluirTurmaIbm.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link
            href={`/admin/escola/ibm/turmas/${id}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Voltar
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar turma</h1>
          <p className="text-sm text-muted-foreground">
            {turma.disciplina.codigo} — {turma.disciplina.nome}
          </p>
        </div>
        <form action={excluirComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
            title="Apaga turma + matrículas + aulas + presenças + avaliações + notas"
          >
            Excluir turma
          </button>
        </form>
      </header>

      <form action={atualizarComId} className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Semestre" required>
          <Input name="semestre" required defaultValue={turma.semestre} placeholder="2026.1" />
        </Field>
        <Field label="Dia da semana" required>
          <Select name="diaSemana" required defaultValue={String(turma.diaSemana)}>
            {DIAS.map((d) => (
              <option key={d.v} value={d.v}>{d.l}</option>
            ))}
          </Select>
        </Field>
        <Field label="Horário" required>
          <Input name="horario" required defaultValue={turma.horario} placeholder="19:30" />
        </Field>
        <Field label="Sala">
          <Input name="sala" defaultValue={turma.sala ?? ""} />
        </Field>
        <Field label="Vagas">
          <Input type="number" name="vagas" min={1} defaultValue={turma.vagas} />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={turma.status}>
            <option value="ABERTA">Aberta</option>
            <option value="FECHADA">Fechada (inscrições)</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="ENCERRADA">Encerrada</option>
          </Select>
        </Field>
        <Field label="Professor">
          <Select name="professorId" defaultValue={turma.professorId ?? ""}>
            <option value="">Sem professor</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Escopo">
          <Select name="igrejaId" defaultValue={turma.igrejaId ?? "GERAL"}>
            <option value="GERAL">🌐 Corporativa / Sede</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>📍 {ig.apelido ?? ig.nome}</option>
            ))}
          </Select>
        </Field>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
