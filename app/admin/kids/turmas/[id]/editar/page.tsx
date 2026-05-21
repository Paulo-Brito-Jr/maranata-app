import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Button } from "@/components/ui/field";
import { atualizarTurma, excluirTurma } from "../../actions";

export const metadata = { title: "Editar turma Kids" };
export const dynamic = "force-dynamic";

export default async function EditarTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [turma, igrejas] = await Promise.all([
    prisma.kidsTurma.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!turma) notFound();

  const atualizarComId = atualizarTurma.bind(null, id);
  const excluirComId = excluirTurma.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/kids/turmas" className="text-sm text-muted-foreground hover:text-primary">
            ← Turmas
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar turma</h1>
        </div>
        <form action={excluirComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
          >
            Excluir turma
          </button>
        </form>
      </header>

      <form action={atualizarComId} className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Nome" required className="md:col-span-2">
          <Input name="nome" required defaultValue={turma.nome} />
        </Field>
        <Field label="Igreja" required>
          <Select name="igrejaId" required defaultValue={turma.igrejaId}>
            {igrejas.map((i) => (
              <option key={i.id} value={i.id}>{i.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Faixa etária" required>
          <Select name="faixaEtaria" required defaultValue={turma.faixaEtaria}>
            <option value="BERCARIO">Berçário (0-2)</option>
            <option value="MATERNAL">Maternal (3-5)</option>
            <option value="KIDS_1">Kids 1 (6-8)</option>
            <option value="KIDS_2">Kids 2 (9-11)</option>
          </Select>
        </Field>
        <Field label="Sala (opcional)">
          <Input name="sala" defaultValue={turma.sala ?? ""} />
        </Field>
        <Field label="Capacidade">
          <Input type="number" name="capacidade" min={1} max={200} defaultValue={turma.capacidade ?? ""} />
        </Field>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
