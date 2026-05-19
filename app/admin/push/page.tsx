import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { dataPtBR } from "@/lib/utils";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import {
  criarPushDireto,
  enviarPushAgoraAction,
  excluirPushAction,
} from "./actions";

export const metadata = { title: "Comunicação" };
export const dynamic = "force-dynamic";

export default async function PushPage() {
  const [pushes, totalUsuarios, totalAssinantes] = await Promise.all([
    prisma.pushNotification.findMany({
      orderBy: { criadoEm: "desc" },
      take: 20,
    }),
    prisma.usuarioApp.count(),
    prisma.pushSubscription.count({ where: { ativa: true } }),
  ]);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const enviadosMes = pushes.filter(
    (p) => p.enviadoEm && p.enviadoEm >= inicioMes,
  ).length;

  return (
    <ModuloShell
      titulo="Comunicação"
      descricao="Push notifications para os usuários do app. Segmentação por igreja, célula ou geral."
      stats={[
        {
          label: "Inscritos no push",
          valor: totalAssinantes,
          ref: `de ${totalUsuarios} usuários cadastrados`,
        },
        { label: "Pushes criados", valor: pushes.length },
        { label: "Enviados (mês)", valor: enviadosMes },
        {
          label: "Aguardando envio",
          valor: pushes.filter((p) => !p.enviadoEm).length,
        },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Criar novo push</h2>
        <form action={criarPushDireto} className="space-y-4">
          <Field label="Título" required>
            <Input
              name="titulo"
              required
              placeholder="🙏 Bom dia, família Maranata!"
            />
          </Field>
          <Field label="Corpo" required>
            <Textarea
              name="corpo"
              rows={3}
              required
              placeholder="Hoje é dia de adoração..."
            />
          </Field>
          <Field label="Alvo">
            <Select name="alvo" defaultValue="TODOS">
              <option value="TODOS">Todos os usuários do app</option>
              <option value="MEMBROS">Só membros cadastrados</option>
              <option value="USUARIOS_APP">Só usuários do app antigo</option>
            </Select>
          </Field>
          <Button type="submit">Criar (sem enviar ainda)</Button>
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
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{p.titulo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {dataPtBR(p.criadoEm)}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{p.corpo}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-secondary/60 px-2 py-0.5">
                    Alvo: {p.alvo}
                  </span>
                  {p.enviadoEm ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                      ✓ Enviado em {dataPtBR(p.enviadoEm)} ·{" "}
                      {p.totalEnviado} entregues
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300">
                      ⏳ Aguardando envio
                    </span>
                  )}

                  <div className="ml-auto flex gap-1">
                    {!p.enviadoEm && (
                      <form action={enviarPushAgoraAction.bind(null, p.id)}>
                        <button
                          className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          type="submit"
                        >
                          Enviar agora
                        </button>
                      </form>
                    )}
                    <form action={excluirPushAction.bind(null, p.id)}>
                      <button
                        className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive hover:bg-destructive/25"
                        type="submit"
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ModuloShell>
  );
}
