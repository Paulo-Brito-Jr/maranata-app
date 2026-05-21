import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { atualizarClasseEbd, excluirClasseEbd } from "../../actions";

export const metadata = { title: "Editar classe EBD" };
export const dynamic = "force-dynamic";

export default async function EditarClasseEbdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [classe, igrejas] = await Promise.all([
    prisma.ebdClasse.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!classe) notFound();

  const atualizarComId = atualizarClasseEbd.bind(null, id);
  const excluirComId = excluirClasseEbd.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href={`/admin/escola/ebd/${id}`} className="text-sm text-muted-foreground hover:text-primary">
            ← Voltar
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar classe EBD</h1>
        </div>
        <form action={excluirComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
            title="Apaga classe + inscrições + aulas + presenças"
          >
            Excluir classe
          </button>
        </form>
      </header>

      <form action={atualizarComId} className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Nome" required>
          <Input name="nome" required defaultValue={classe.nome} />
        </Field>
        <Field label="Igreja" required>
          <Select name="igrejaId" required defaultValue={classe.igrejaId}>
            {igrejas.map((i) => (
              <option key={i.id} value={i.id}>{i.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Faixa">
          <Select name="faixa" defaultValue={classe.faixa}>
            <option value="BERCARIO">Berçário</option>
            <option value="CRIANCAS">Crianças (4-7)</option>
            <option value="PRE_ADOLESCENTES">Pré-adolescentes (8-11)</option>
            <option value="ADOLESCENTES">Adolescentes (12-15)</option>
            <option value="JOVENS">Jovens (16-29)</option>
            <option value="ADULTOS">Adultos</option>
            <option value="CASAIS">Casais</option>
            <option value="LIDERES">Líderes</option>
            <option value="TERCEIRA_IDADE">Terceira idade</option>
            <option value="GERAL">Geral</option>
          </Select>
        </Field>
        <Field label="Professor principal">
          <Input name="professorPrincipal" defaultValue={classe.professorPrincipal ?? ""} />
        </Field>
        <Field label="Sala">
          <Input name="sala" defaultValue={classe.sala ?? ""} />
        </Field>
        <Field label="Ciclo" required>
          <Input name="ciclo" required defaultValue={classe.ciclo} />
        </Field>
        <Field label="Capacidade">
          <Input
            type="number"
            name="capacidade"
            min={1}
            max={500}
            defaultValue={classe.capacidade ?? ""}
          />
        </Field>
        <Field label="Descrição" className="md:col-span-2">
          <Textarea name="descricao" rows={2} defaultValue={classe.descricao ?? ""} />
        </Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="ativa" defaultChecked={classe.ativa} />
          Classe ativa
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
