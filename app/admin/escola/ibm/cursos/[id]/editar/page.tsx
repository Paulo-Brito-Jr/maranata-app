import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Textarea, Button, Select } from "@/components/ui/field";
import { atualizarCurso, excluirCurso } from "../../actions";

export const metadata = { title: "Editar curso IBM" };
export const dynamic = "force-dynamic";

export default async function EditarCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [curso, igrejas] = await Promise.all([
    prisma.ibmCurso.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!curso) notFound();

  const atualizarComId = atualizarCurso.bind(null, id);
  const excluirComId = excluirCurso.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link
            href={`/admin/escola/ibm/cursos/${id}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            ← Voltar
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar curso</h1>
        </div>
        <form action={excluirComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
            title="Apaga curso + disciplinas + turmas + matrículas + presenças"
          >
            Excluir curso
          </button>
        </form>
      </header>

      <form action={atualizarComId} className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Nome" required className="md:col-span-2">
          <Input name="nome" required defaultValue={curso.nome} />
        </Field>
        <Field label="Carga horária total (h)" required>
          <Input
            type="number"
            name="cargaHoraria"
            min={1}
            required
            defaultValue={curso.cargaHoraria}
          />
        </Field>
        <Field label="Duração (semestres)" required>
          <Input
            type="number"
            name="duracaoSemestres"
            min={1}
            max={20}
            required
            defaultValue={curso.duracaoSemestres}
          />
        </Field>
        <Field label="Descrição" className="md:col-span-2">
          <Textarea name="descricao" rows={2} defaultValue={curso.descricao ?? ""} />
        </Field>
        <Field label="Escopo" className="md:col-span-2">
          <Select name="igrejaId" defaultValue={curso.igrejaId ?? "GERAL"}>
            <option value="GERAL">🌐 Geral (corporativo / sede)</option>
            {igrejas.map((ig) => (
              <option key={ig.id} value={ig.id}>
                📍 Local — {ig.apelido ?? ig.nome}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="ativo" defaultChecked={curso.ativo} />
          Curso ativo
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
