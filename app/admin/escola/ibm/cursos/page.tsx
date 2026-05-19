import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import { criarCurso } from "./actions";

export const metadata = { title: "Cursos IBM" };
export const dynamic = "force-dynamic";

export default async function CursosPage() {
  const cursos = await prisma.ibmCurso.findMany({
    include: {
      _count: { select: { disciplinas: true, matriculas: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <ModuloShell
      titulo="Cursos IBM"
      descricao="Grades curriculares do seminário. Cada curso tem várias disciplinas em vários semestres."
      stats={[
        { label: "Cursos ativos", valor: cursos.filter((c) => c.ativo).length },
        { label: "Total matrículas", valor: cursos.reduce((a, c) => a + c._count.matriculas, 0) },
      ]}
      acoes={[{ href: "/admin/escola", label: "← Hub" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Novo curso</h2>
        <form action={criarCurso} className="grid gap-3 md:grid-cols-2">
          <Field label="Nome" required className="md:col-span-2">
            <Input name="nome" required placeholder="Bacharel em Teologia" />
          </Field>
          <Field label="Carga horária total (h)" required>
            <Input type="number" name="cargaHoraria" min={1} required defaultValue={2400} />
          </Field>
          <Field label="Duração (semestres)" required>
            <Input type="number" name="duracaoSemestres" min={1} max={20} required defaultValue={8} />
          </Field>
          <Field label="Descrição" className="md:col-span-2">
            <Textarea name="descricao" rows={2} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Criar curso</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Cursos ({cursos.length})
        </h2>
        {cursos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie o primeiro curso acima.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {cursos.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
              >
                <Link href={`/admin/escola/ibm/cursos/${c.id}`} className="block">
                  <p className="font-semibold">{c.nome}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {c.cargaHoraria}h · {c.duracaoSemestres} semestres
                  </p>
                  <p className="mt-2 text-xs">
                    {c._count.disciplinas} disciplina(s) · {c._count.matriculas} matrícula(s)
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
