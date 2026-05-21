import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GraduationCap } from "lucide-react";

export const metadata = { title: "Escola Bíblica" };
export const dynamic = "force-dynamic";

export default async function MembroEscola() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/escola");

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (!membro) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
        Sem cadastro de membro vinculado ao seu e-mail. Procure a secretaria.
      </div>
    );
  }

  const [ebd, ibm] = await Promise.all([
    prisma.ebdInscricao.findMany({
      where: { membroId: membro.id, status: "ATIVA" },
      include: {
        classe: { select: { id: true, nome: true, faixa: true, sala: true, horario: true } },
        presencas: { select: { presente: true } },
      },
    }),
    prisma.ibmMatricula.findMany({
      where: { alunoId: membro.id },
      include: {
        turma: {
          include: {
            disciplina: { select: { codigo: true, nome: true, cargaHoraria: true } },
            professor: { select: { nome: true } },
            _count: { select: { aulas: true } },
          },
        },
        notas: { include: { avaliacao: { select: { titulo: true, peso: true, notaMax: true } } } },
        presencas: { select: { presente: true } },
      },
      orderBy: { criadaEm: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-brand-blue to-brand-orange p-6 text-white shadow-xl">
        <GraduationCap className="size-8" />
        <h1 className="mt-3 text-2xl font-bold">Escola Bíblica</h1>
        <p className="mt-1 text-sm opacity-90">
          Suas classes, suas matrículas, suas notas.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          EBD (Escola Dominical)
        </h2>
        {ebd.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/40 p-4 text-center text-sm text-muted-foreground">
            Você não está inscrito em nenhuma classe EBD no ciclo atual. Procure a secretaria
            pra se inscrever.
          </p>
        ) : (
          <ul className="space-y-2">
            {ebd.map((i) => {
              const presentes = i.presencas.filter((p) => p.presente).length;
              return (
                <li
                  key={i.id}
                  className="rounded-2xl border border-border bg-card p-4 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{i.classe.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.classe.faixa} · domingos {i.classe.horario}
                        {i.classe.sala && ` · sala ${i.classe.sala}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                      {presentes} presença(s)
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          IBM (Seminário)
        </h2>
        {ibm.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/40 p-4 text-center text-sm text-muted-foreground">
            Nenhuma matrícula no IBM. Veja os cursos disponíveis com a coordenação.
          </p>
        ) : (
          <ul className="space-y-3">
            {ibm.map((m) => {
              let totalPeso = 0;
              let somaPond = 0;
              for (const n of m.notas) {
                const peso = Number(n.avaliacao.peso);
                totalPeso += peso;
                somaPond += (Number(n.valor) / Number(n.avaliacao.notaMax)) * 10 * peso;
              }
              const media = totalPeso > 0 ? somaPond / totalPeso : null;
              const totalAulas = m.turma._count.aulas;
              const faltas = m.presencas.filter((p) => !p.presente).length;
              const pctFaltas = totalAulas > 0 ? (faltas / totalAulas) * 100 : 0;

              return (
                <li
                  key={m.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {m.turma.disciplina.codigo} · {m.turma.semestre}
                      </p>
                      <p className="font-semibold">{m.turma.disciplina.nome}</p>
                      {m.turma.professor && (
                        <p className="text-xs text-muted-foreground">
                          Prof. {m.turma.professor.nome}
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        m.status === "APROVADO"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : m.status === "REPROVADO"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <p className="text-muted-foreground">Média</p>
                      <p className="text-lg font-bold">
                        {media !== null ? media.toFixed(1) : "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/40 p-2">
                      <p className="text-muted-foreground">Faltas</p>
                      <p className="text-lg font-bold">
                        {faltas}/{totalAulas}
                      </p>
                    </div>
                    <div
                      className={`rounded-lg p-2 ${
                        pctFaltas > 20
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-secondary/40"
                      }`}
                    >
                      <p className="text-muted-foreground">% faltas</p>
                      <p className="text-lg font-bold">{pctFaltas.toFixed(0)}%</p>
                    </div>
                  </div>

                  {m.notas.length > 0 && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        Detalhe das notas ({m.notas.length})
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {m.notas.map((n) => (
                          <li
                            key={n.id}
                            className="flex items-center justify-between rounded bg-secondary/30 px-2 py-1"
                          >
                            <span>{n.avaliacao.titulo}</span>
                            <span className="font-mono">
                              {String(n.valor)} / {String(n.avaliacao.notaMax)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link
        href="/membro/mais"
        className="block rounded-2xl border border-border bg-card p-4 text-center text-sm text-muted-foreground hover:bg-secondary/40"
      >
        ← voltar
      </Link>
    </div>
  );
}
