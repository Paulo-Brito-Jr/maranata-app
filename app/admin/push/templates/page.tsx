import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { criarTemplate, removerTemplate } from "./actions";

export const metadata = { title: "Templates de push" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await prisma.pushTemplate.findMany({
    orderBy: [{ ativo: "desc" }, { usos: "desc" }],
  });

  return (
    <ModuloShell
      titulo="Templates de push"
      descricao="Mensagens reutilizáveis pra economizar tempo no Composer."
      stats={[
        { label: "Templates ativos", valor: templates.filter((t) => t.ativo).length },
        { label: "Usos totais", valor: templates.reduce((a, t) => a + t.usos, 0) },
      ]}
      acoes={[{ href: "/admin/push", label: "← Composer" }]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Novo template</h2>
        <form action={criarTemplate} className="space-y-4">
          <Field label="Nome" required hint="Identificador único, ex: 'culto-domingo' ou 'dizimo-mensal'">
            <Input name="nome" required maxLength={60} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Título" required>
              <Input name="titulo" required maxLength={120} />
            </Field>
            <Field label="Link (opcional)">
              <Input name="url" placeholder="/membro/eventos" />
            </Field>
          </div>
          <Field label="Mensagem" required>
            <Textarea name="corpo" required rows={3} maxLength={500} />
          </Field>
          <Field label="Público padrão">
            <Select name="alvoPadrao" defaultValue="TODOS">
              <option value="TODOS">Todos</option>
              <option value="MEMBROS">Membros</option>
              <option value="USUARIOS_APP">Usuários app antigo</option>
              <option value="CUSTOM">Custom</option>
            </Select>
          </Field>
          <Button type="submit">Criar template</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Templates existentes ({templates.length})
        </h2>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">Crie o primeiro template acima.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {templates.map((t) => (
              <li
                key={t.id}
                className={`rounded-2xl border bg-card p-4 ${
                  t.ativo ? "border-border" : "border-dashed opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{t.nome}</p>
                    <p className="mt-0.5 font-semibold">{t.titulo}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{t.usos} usos</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.corpo}</p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-secondary/60 px-2 py-0.5">
                    {t.alvoPadrao}
                  </span>
                  <Link
                    href="/admin/push"
                    className="ml-auto text-primary underline"
                  >
                    usar agora
                  </Link>
                  <form action={removerTemplate.bind(null, t.id)}>
                    <button className="text-destructive hover:underline">remover</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}
