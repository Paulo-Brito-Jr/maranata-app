import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { criarCampanha } from "../../actions";

export const metadata = { title: "Nova campanha" };

export default async function NovaCampanhaPage() {
  const igrejas = await prisma.igreja.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link
          href="/admin/financeiro/campanhas"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Voltar
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Nova campanha</h1>
      </header>

      <form action={criarCampanha} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <Field label="Título" required>
          <Input name="titulo" placeholder="Ex: Maranata 2026 — Construindo Juntos" required />
        </Field>
        <Field label="Slug (URL)" hint="só letras minúsculas, números e hífen" required>
          <Input name="slug" placeholder="maranata-2026" required />
        </Field>
        <Field label="Descrição">
          <Textarea name="descricao" rows={3} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Meta (R$)">
            <Input type="number" step="0.01" min="0" name="meta" placeholder="0,00" />
          </Field>
          <Field label="Início">
            <Input type="date" name="inicio" />
          </Field>
          <Field label="Fim">
            <Input type="date" name="fim" />
          </Field>
        </div>
        <Field label="Igreja específica">
          <Select name="igrejaId" defaultValue="">
            <option value="">Todas as igrejas (denominação)</option>
            {igrejas.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit">Criar campanha</Button>
      </form>
    </div>
  );
}
