import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { dataPtBR } from "@/lib/utils";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import { criarPush } from "../pregacoes/actions";

export const metadata = { title: "Comunicação" };
export const dynamic = "force-dynamic";

export default async function PushPage() {
  const [pushes, totalUsuarios] = await Promise.all([
    prisma.pushNotification.findMany({ orderBy: { criadoEm: "desc" }, take: 20 }),
    prisma.usuarioApp.count(),
  ]);

  return (
    <ModuloShell
      titulo="Comunicação"
      descricao="Push notifications para os usuários do app. Segmentação por igreja, faixa, célula."
      stats={[
        { label: "Usuários no app", valor: totalUsuarios, ref: "InChurch: 6.662 (zero envios)" },
        { label: "Pushes criados", valor: pushes.length },
        { label: "Enviados (mês)", valor: pushes.filter((p) => p.enviadoEm).length },
        { label: "Aguardando envio", valor: pushes.filter((p) => !p.enviadoEm).length },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Criar novo push</h2>
        <form action={criarPush} className="space-y-4">
          <Field label="Título" required>
            <Input name="titulo" required placeholder="🙏 Bom dia, família Maranata!" />
          </Field>
          <Field label="Corpo" required>
            <Textarea name="corpo" rows={3} required placeholder="Hoje é dia de adoração..." />
          </Field>
          <Field label="Alvo">
            <Select name="alvo" defaultValue="TODOS">
              <option value="TODOS">Todos os usuários do app</option>
              <option value="MEMBROS">Só membros cadastrados</option>
              <option value="USUARIOS_APP">Só usuários do app antigo</option>
            </Select>
          </Field>
          <Button type="submit">Criar</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Histórico
        </h2>
        {pushes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum push criado.</p>
        ) : (
          <div className="space-y-2">
            {pushes.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.titulo}</span>
                  <span className="text-xs text-muted-foreground">{dataPtBR(p.criadoEm)}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{p.corpo}</p>
                <div className="mt-2 text-xs">
                  Alvo: {p.alvo}{" "}
                  {p.enviadoEm ? (
                    <span className="text-success">· Enviado em {dataPtBR(p.enviadoEm)}</span>
                  ) : (
                    <span className="text-warning">· Aguardando envio</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ModuloShell>
  );
}
