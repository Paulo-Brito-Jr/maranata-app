import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import { criarDisciplina } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await prisma.ibmCurso.findUnique({ where: { id }, select: { nome: true } });
  return { title: c?.nome ?? "Curso" };
}

export default async function CursoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const curso = await prisma.ibmCurso.findUnique({
    where: { id },
    include: {
      disciplinas: {
        orderBy: [{ semestreSugerido: "asc" }, { codigo: "asc" }],
        include: {
          _count: { select: { turmas: true } },
        },
      },
    },
  });
  if (!curso) notFound();

  const porSemestre = new Map<number, typeof curso.disciplinas>();
  for (const d of curso.disciplinas) {
    const lista = porSemestre.get(d.semestreSugerido) ?? [];
    lista.push(d);
    porSemestre.set(d.semestreSugerido, lista);
  }

  return (
    <ModuloShell
      titulo={curso.nome}
      descricao={curso.descricao ?? `${curso.cargaHoraria}h · ${curso.duracaoSemestres} semestres`}
      stats={[
        { label: "Disciplinas", valor: curso.disciplinas.length },
        {
          label: "Carga atual",
          valor: `${curso.disciplinas.reduce((a, d) => a + d.cargaHoraria, 0)}h / ${curso.cargaHoraria}h`,
        },
      ]}
      acoes={[{ href: "/admin/escola/ibm/cursos", label: "← Cursos" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Nova disciplina</h2>
        <form action={criarDisciplina} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="cursoId" value={id} />
          <Field label="Código" required hint="Ex: TEO101, HEB201">
            <Input name="codigo" required maxLength={20} />
          </Field>
          <Field label="Nome" required>
            <Input name="nome" required maxLength={150} />
          </Field>
          <Field label="Créditos" required>
            <Input type="number" name="creditos" min={1} max={20} defaultValue={2} required />
          </Field>
          <Field label="Carga horária (h)" required>
            <Input type="number" name="cargaHoraria" min={10} max={240} defaultValue={40} required />
          </Field>
          <Field label="Semestre sugerido" required>
            <Input
              type="number"
              name="semestreSugerido"
              min={1}
              max={curso.duracaoSemestres}
              defaultValue={1}
              required
            />
          </Field>
          <Field label="Ementa" className="md:col-span-2">
            <Textarea name="ementa" rows={3} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Adicionar disciplina</Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Grade curricular
        </h2>
        {curso.disciplinas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem disciplinas ainda.</p>
        ) : (
          Array.from(porSemestre.keys())
            .sort((a, b) => a - b)
            .map((sem) => (
              <div key={sem}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                  Semestre {sem}
                </h3>
                <ul className="grid gap-2 md:grid-cols-2">
                  {porSemestre.get(sem)!.map((d) => (
                    <li
                      key={d.id}
                      className="rounded-2xl border border-border bg-card p-3 text-sm hover:border-primary/40"
                    >
                      <Link href={`/admin/escola/ibm/disciplinas/${d.id}`} className="block">
                        <p className="font-mono text-xs text-muted-foreground">{d.codigo}</p>
                        <p className="font-semibold">{d.nome}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {d.creditos} cr · {d.cargaHoraria}h · {d._count.turmas} turma(s)
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
      </section>
    </ModuloShell>
  );
}
