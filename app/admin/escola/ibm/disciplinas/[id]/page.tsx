import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Select, Button } from "@/components/ui/field";
import { criarTurma } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.ibmDisciplina.findUnique({ where: { id }, select: { nome: true } });
  return { title: d?.nome ?? "Disciplina" };
}

function semestrePadrao(): string {
  const ano = new Date().getFullYear();
  const sem = new Date().getMonth() < 6 ? 1 : 2;
  return `${ano}.${sem}`;
}

export default async function DisciplinaDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const disc = await prisma.ibmDisciplina.findUnique({
    where: { id },
    include: {
      curso: { select: { id: true, nome: true } },
      turmas: {
        include: {
          professor: { select: { nome: true } },
          _count: { select: { matriculas: true, aulas: true } },
        },
        orderBy: { semestre: "desc" },
      },
    },
  });
  if (!disc) notFound();

  const professores = await prisma.ibmProfessor.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <ModuloShell
      titulo={`${disc.codigo} · ${disc.nome}`}
      descricao={disc.ementa ?? `${disc.creditos} créditos · ${disc.cargaHoraria}h`}
      stats={[
        { label: "Turmas ofertadas", valor: disc.turmas.length },
        { label: "Curso", valor: disc.curso.nome },
      ]}
      acoes={[
        { href: `/admin/escola/ibm/cursos/${disc.curso.id}`, label: "← Curso" },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova turma</h2>
        <form action={criarTurma} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="disciplinaId" value={id} />
          <Field label="Semestre" required>
            <Input name="semestre" defaultValue={semestrePadrao()} required maxLength={10} />
          </Field>
          <Field label="Professor">
            <Select name="professorId">
              <option value="">A definir</option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dia da semana" required>
            <Select name="diaSemana" required defaultValue="3">
              <option value="0">Domingo</option>
              <option value="1">Segunda</option>
              <option value="2">Terça</option>
              <option value="3">Quarta</option>
              <option value="4">Quinta</option>
              <option value="5">Sexta</option>
              <option value="6">Sábado</option>
            </Select>
          </Field>
          <Field label="Horário" required>
            <Input name="horario" defaultValue="19:30" required maxLength={5} />
          </Field>
          <Field label="Sala">
            <Input name="sala" maxLength={40} />
          </Field>
          <Field label="Vagas">
            <Input type="number" name="vagas" min={1} max={200} defaultValue={40} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Criar turma</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Turmas
        </h2>
        {disc.turmas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma turma criada ainda.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {disc.turmas.map((t) => (
              <li
                key={t.id}
                className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
              >
                <Link href={`/admin/escola/ibm/turmas/${t.id}`} className="block">
                  <p className="font-semibold">{disc.codigo} · {t.semestre}</p>
                  <p className="text-xs text-muted-foreground">
                    {diaSemana(t.diaSemana)} {t.horario}
                    {t.sala && ` · ${t.sala}`}
                  </p>
                  {t.professor && (
                    <p className="text-xs text-muted-foreground">
                      Prof. {t.professor.nome}
                    </p>
                  )}
                  <p className="mt-2 text-xs">
                    {t._count.matriculas}/{t.vagas} matriculados · {t._count.aulas} aulas
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}

function diaSemana(n: number): string {
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][n] ?? "?";
}
