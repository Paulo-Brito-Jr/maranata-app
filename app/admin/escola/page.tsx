import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { GraduationCap, BookOpen, Users, Calendar, ClipboardList } from "lucide-react";

export const metadata = { title: "Escola Bíblica" };
export const dynamic = "force-dynamic";

export default async function EscolaHub() {
  const [
    ebdClasses,
    ebdInscritos,
    ebdAulasFuturas,
    ibmCursos,
    ibmTurmas,
    ibmMatriculas,
    ibmProfessores,
  ] = await Promise.all([
    prisma.ebdClasse.count({ where: { ativa: true } }),
    prisma.ebdInscricao.count({ where: { status: "ATIVA" } }),
    prisma.ebdAula.count({ where: { data: { gte: new Date() } } }),
    prisma.ibmCurso.count({ where: { ativo: true } }),
    prisma.ibmTurma.count({ where: { status: { in: ["ABERTA", "EM_ANDAMENTO"] } } }),
    prisma.ibmMatricula.count(),
    prisma.ibmProfessor.count({ where: { ativo: true } }),
  ]);

  return (
    <ModuloShell
      titulo="Escola Bíblica"
      descricao="EBD (Dominical) + IBM (Seminário). Inscrições, presença, notas, boletim."
      stats={[
        { label: "Classes EBD ativas", valor: ebdClasses },
        { label: "Alunos EBD", valor: ebdInscritos },
        { label: "Cursos IBM", valor: ibmCursos },
        { label: "Matrículas IBM", valor: ibmMatriculas },
      ]}
    >
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          EBD — Escola Bíblica Dominical
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card
            href="/admin/escola/ebd"
            titulo="Classes"
            valor={ebdClasses}
            desc="domingos 09h"
            icon={BookOpen}
          />
          <Card
            href="/admin/escola/ebd?aba=inscritos"
            titulo="Inscritos"
            valor={ebdInscritos}
            desc="ativos no ciclo"
            icon={Users}
          />
          <Card
            href="/admin/escola/ebd?aba=aulas"
            titulo="Aulas próximas"
            valor={ebdAulasFuturas}
            desc="próximos domingos"
            icon={Calendar}
          />
          <Card
            href="/admin/escola/ebd?aba=nova"
            titulo="Nova classe"
            valor="+"
            desc="abrir classe"
            icon={GraduationCap}
            destacar
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          IBM — Instituto Bíblico Maranata
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card
            href="/admin/escola/ibm/cursos"
            titulo="Cursos"
            valor={ibmCursos}
            desc="grades curriculares"
            icon={GraduationCap}
          />
          <Card
            href="/admin/escola/ibm/turmas"
            titulo="Turmas"
            valor={ibmTurmas}
            desc="ofertadas no semestre"
            icon={Users}
          />
          <Card
            href="/admin/escola/ibm/professores"
            titulo="Professores"
            valor={ibmProfessores}
            desc="cadastrados"
            icon={Users}
          />
          <Card
            href="/admin/escola/ibm/boletim"
            titulo="Boletim"
            valor=""
            desc="ver médias/faltas"
            icon={ClipboardList}
          />
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Aluno vê suas classes + matrículas + notas em{" "}
        <Link href="/membro/escola" className="text-primary underline">
          /membro/escola
        </Link>
      </p>
    </ModuloShell>
  );
}

function Card({
  href,
  titulo,
  valor,
  desc,
  icon: Icon,
  destacar,
}: {
  href: string;
  titulo: string;
  valor: number | string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  destacar?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-2 rounded-2xl border p-5 transition ${
        destacar
          ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <Icon className="size-5 text-primary" />
        <span className="text-2xl font-bold">{valor}</span>
      </div>
      <div>
        <p className="font-medium">{titulo}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
