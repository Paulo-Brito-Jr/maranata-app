import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Button } from "@/components/ui/field";
import { atualizarDoador, excluirDoador } from "../../actions";

export const metadata = { title: "Editar doador" };
export const dynamic = "force-dynamic";

export default async function EditarDoadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [doador, igrejas] = await Promise.all([
    prisma.doador.findUnique({ where: { id } }),
    prisma.igreja.findMany({
      where: { ativa: true },
      select: { id: true, nome: true, tipo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    }),
  ]);
  if (!doador) notFound();

  const atualizarComId = atualizarDoador.bind(null, id);
  const excluirComId = excluirDoador.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/doadores" className="text-sm text-muted-foreground hover:text-primary">
            ← Doadores
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar doador</h1>
        </div>
        <form action={excluirComId}>
          <button
            type="submit"
            className="rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
          >
            Excluir
          </button>
        </form>
      </header>

      <form action={atualizarComId} className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
        <Field label="Nome" required className="md:col-span-2">
          <Input name="nome" required defaultValue={doador.nome} />
        </Field>
        <Field label="E-mail">
          <Input type="email" name="email" defaultValue={doador.email ?? ""} />
        </Field>
        <Field label="Telefone">
          <Input name="telefone" defaultValue={doador.telefone ?? ""} />
        </Field>
        <Field label="Documento (CPF/CNPJ)">
          <Input name="documento" defaultValue={doador.documento ?? ""} />
        </Field>
        <Field label="Tipo">
          <Select name="personType" defaultValue={doador.personType ?? ""}>
            <option value="">—</option>
            <option value="natural_person">Pessoa física</option>
            <option value="legal_person">Pessoa jurídica</option>
          </Select>
        </Field>
        <Field label="PIX">
          <Input name="pixKey" defaultValue={doador.pixKey ?? ""} />
        </Field>
        <Field label="Banco">
          <Input name="banco" defaultValue={doador.banco ?? ""} />
        </Field>
        <Field label="Agência">
          <Input name="agencia" defaultValue={doador.agencia ?? ""} />
        </Field>
        <Field label="Conta">
          <Input name="conta" defaultValue={doador.conta ?? ""} />
        </Field>
        <Field label="Igreja" className="md:col-span-2">
          <Select name="igrejaId" defaultValue={doador.igrejaId ?? ""}>
            {igrejas.map((i) => (
              <option key={i.id} value={i.id}>{i.nome}{i.tipo === "SEDE" ? " (Sede)" : ""}</option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" name="hasWhatsapp" defaultChecked={doador.hasWhatsapp} />
          Tem WhatsApp
        </label>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
