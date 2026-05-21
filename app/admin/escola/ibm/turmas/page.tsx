import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";

export const metadata = { title: "Turmas IBM" };
export const dynamic = "force-dynamic";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function TurmasPage() {
  const ctx = await getIgrejaContexto();
  const filtroIgreja = filtroIgrejaWhere(ctx);
  const turmaWhere = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const turmas = await prisma.ibmTurma.findMany({
    where: turmaWhere,
    include: {
      disciplina: { include: { curso: { select: { nome: true } } } },
      professor: { select: { nome: true } },
      igreja: { select: { nome: true, apelido: true } },
      _count: { select: { matriculas: true } },
    },
    orderBy: [{ semestre: "desc" }, { disciplina: { codigo: "asc" } }],
    take: 200,
  });

  const porSemestre = new Map<string, typeof turmas>();
  for (const t of turmas) {
    const k = t.semestre;
    const lista = porSemestre.get(k) ?? [];
    lista.push(t);
    porSemestre.set(k, lista);
  }

  return (
    <ModuloShell
      titulo="Turmas IBM"
      descricao="Todas as turmas ofertadas, agrupadas por semestre."
      stats={[
        { label: "Total turmas", valor: turmas.length },
        { label: "Semestres", valor: porSemestre.size },
      ]}
      acoes={[{ href: "/admin/escola/ibm/cursos", label: "← Cursos" }]}
    >
      {turmas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma turma ainda. Crie pela página da disciplina.
        </p>
      ) : (
        Array.from(porSemestre.keys()).map((sem) => (
          <section key={sem}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">
              {sem}
            </h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {porSemestre.get(sem)!.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/escola/ibm/turmas/${t.id}`}
                    className="block rounded-2xl border border-border bg-card p-4 text-sm hover:border-primary/40"
                  >
                    <p className="font-mono text-xs text-muted-foreground">
                      {t.disciplina.codigo}
                    </p>
                    <p className="font-semibold">{t.disciplina.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.disciplina.curso.nome} · {DIAS[t.diaSemana]} {t.horario}
                      {t.sala && ` · ${t.sala}`}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xs">
                      <span>
                        {t._count.matriculas}/{t.vagas} alunos
                        {t.professor && ` · Prof. ${t.professor.nome}`}
                      </span>
                      {t.igreja ? (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                          📍 {t.igreja.apelido ?? t.igreja.nome}
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] text-blue-700 dark:text-blue-300">
                          🌐 Geral
                        </span>
                      )}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </ModuloShell>
  );
}
