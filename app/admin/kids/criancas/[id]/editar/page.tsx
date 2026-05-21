import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Button, Textarea } from "@/components/ui/field";
import { atualizarCrianca, excluirCrianca } from "../../../actions";

export const metadata = { title: "Editar criança" };
export const dynamic = "force-dynamic";

function ymd(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function EditarCriancaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [crianca, igrejas] = await Promise.all([
    prisma.kidsCrianca.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!crianca) notFound();

  const atualizarComId = atualizarCrianca.bind(null, id);
  const excluirComId = excluirCrianca.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/kids/criancas" className="text-sm text-muted-foreground hover:text-primary">
            ← Crianças
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar criança</h1>
        </div>
        <form action={excluirComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
            title="Apaga criança + responsáveis + histórico de check-ins"
          >
            Excluir
          </button>
        </form>
      </header>

      <form action={atualizarComId} className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Nome" required className="md:col-span-2">
          <Input name="nome" required defaultValue={crianca.nome} />
        </Field>
        <Field label="Igreja" required>
          <Select name="igrejaId" required defaultValue={crianca.igrejaId}>
            {igrejas.map((i) => (
              <option key={i.id} value={i.id}>{i.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Data de nascimento">
          <Input
            type="date"
            name="dataNascimento"
            defaultValue={ymd(crianca.dataNascimento)}
          />
        </Field>
        <Field label="Faixa etária" required>
          <Select name="faixaEtaria" required defaultValue={crianca.faixaEtaria}>
            <option value="BERCARIO">Berçário (0-2)</option>
            <option value="MATERNAL">Maternal (3-5)</option>
            <option value="KIDS_1">Kids 1 (6-8)</option>
            <option value="KIDS_2">Kids 2 (9-11)</option>
          </Select>
        </Field>
        <Field label="Alergias" className="md:col-span-2">
          <Textarea name="alergias" rows={2} defaultValue={crianca.alergias ?? ""} />
        </Field>
        <Field label="Restrições alimentares" className="md:col-span-2">
          <Textarea
            name="restricoesAlim"
            rows={2}
            defaultValue={crianca.restricoesAlim ?? ""}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="autorizaImagem"
            defaultChecked={crianca.autorizaImagem}
          />
          Autoriza uso de imagem
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="ativa" defaultChecked={crianca.ativa} />
          Ativa
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
