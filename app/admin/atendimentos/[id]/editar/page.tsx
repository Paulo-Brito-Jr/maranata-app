import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { atualizarAtendimentoAction, excluirAtendimentoAction } from "../../actions";

export const metadata = { title: "Editar atendimento" };
export const dynamic = "force-dynamic";

const TIPOS = [
  { value: "visita", label: "Visita" },
  { value: "ligacao", label: "Ligação" },
  { value: "oracao", label: "Oração" },
  { value: "aconselhamento", label: "Aconselhamento" },
  { value: "outro", label: "Outro" },
];

function dtLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function EditarAtendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [atend, membros, pastores] = await Promise.all([
    prisma.atendimentoPastoral.findUnique({ where: { id } }),
    prisma.membro.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
      take: 500,
    }),
    prisma.usuario.findMany({
      where: {
        papel: { in: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"] },
        ativo: true,
      },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);
  if (!atend) notFound();

  const atualizarComId = atualizarAtendimentoAction.bind(null, id);
  const excluirComId = excluirAtendimentoAction.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link href="/admin/atendimentos" className="text-sm text-muted-foreground hover:text-primary">
            ← Atendimentos
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editar atendimento</h1>
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
        <Field label="Membro" required>
          <Select name="membroId" required defaultValue={atend.membroId}>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Pastor" required>
          <Select name="pastorId" required defaultValue={atend.pastorId ?? ""}>
            <option value="">Selecione</option>
            {pastores.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo" required>
          <Select name="tipo" required defaultValue={atend.tipo}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Data">
          <Input type="date" name="realizadoEm" defaultValue={dtLocal(atend.realizadoEm)} />
        </Field>
        <Field label="Resumo" required className="md:col-span-2">
          <Input name="resumo" required defaultValue={atend.resumo} />
        </Field>
        <Field label="Detalhes" className="md:col-span-2">
          <Textarea name="detalhes" rows={4} defaultValue={atend.detalhes ?? ""} />
        </Field>
        <Field label="Próxima ação" className="md:col-span-2">
          <Input name="proximaAcao" defaultValue={atend.proximaAcao ?? ""} />
        </Field>
        <div className="md:col-span-2">
          <Button type="submit">Salvar alterações</Button>
        </div>
      </form>
    </div>
  );
}
