import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import {
  criarMensagemAction,
  atualizarMensagemAction,
  toggleMensagemAtivaAction,
  excluirMensagemAction,
} from "./actions";

export const metadata = { title: "Mensagens do sistema" };
export const dynamic = "force-dynamic";

function listaVariaveis(variaveisJson: unknown): string {
  if (Array.isArray(variaveisJson))
    return (variaveisJson as unknown[]).map(String).join(", ");
  return "";
}

export default async function MensagensPage() {
  const mensagens = await prisma.mensagemSistema.findMany({
    orderBy: { chave: "asc" },
  });

  const ativas = mensagens.filter((m) => m.ativa).length;

  return (
    <ModuloShell
      titulo="Mensagens do sistema"
      descricao="Copy editável do app — textos de boas-vindas, e-mails transacionais, banners, push genéricos. Use {variavel} dentro do conteúdo."
      stats={[
        { label: "Mensagens", valor: mensagens.length },
        { label: "Ativas", valor: ativas },
      ]}
    >
      <details className="rounded-2xl border border-border bg-card p-5" open>
        <summary className="cursor-pointer text-sm font-semibold">
          Criar nova mensagem
        </summary>
        <form action={criarMensagemAction} className="mt-4 grid gap-3">
          <Field label="Chave (snake_case)" required>
            <Input
              name="chave"
              placeholder="welcome_email"
              required
            />
          </Field>
          <Field label="Título" required>
            <Input
              name="titulo"
              placeholder="Bem-vindo(a) à Maranata"
              required
            />
          </Field>
          <Field
            label="Conteúdo"
            hint="Use {nome}, {igreja}, etc. como placeholders"
            required
          >
            <Textarea
              name="conteudo"
              rows={6}
              placeholder="Olá {nome}, seja bem-vindo à {igreja}!"
              required
            />
          </Field>
          <Field
            label="Variáveis disponíveis"
            hint="Uma por linha ou separadas por vírgula"
          >
            <Input
              name="variaveis"
              placeholder="nome, igreja, data_evento"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ativa" defaultChecked />
            Ativa
          </label>
          <div>
            <Button type="submit">Criar mensagem</Button>
          </div>
        </form>
      </details>

      {mensagens.length === 0 ? (
        <EmptyState
          titulo="Nenhuma mensagem cadastrada"
          descricao="Use o formulário acima para criar a primeira."
        />
      ) : (
        <div className="space-y-3">
          {mensagens.map((m) => (
            <form
              key={m.id}
              action={atualizarMensagemAction}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="chave" value={m.chave} />
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {m.chave}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    formAction={toggleMensagemAtivaAction.bind(
                      null,
                      m.id,
                      !m.ativa,
                    )}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      m.ativa
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-secondary/60 text-muted-foreground"
                    }`}
                  >
                    {m.ativa ? "✓ Ativa" : "Inativa"}
                  </button>
                  <button
                    formAction={excluirMensagemAction.bind(null, m.id)}
                    className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive hover:bg-destructive/25"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                <Field label="Título">
                  <Input name="titulo" defaultValue={m.titulo} />
                </Field>
                <Field label="Conteúdo">
                  <Textarea
                    name="conteudo"
                    rows={4}
                    defaultValue={m.conteudo}
                  />
                </Field>
                <Field
                  label="Variáveis"
                  hint="Uma por linha ou separadas por vírgula"
                >
                  <Input
                    name="variaveis"
                    defaultValue={listaVariaveis(m.variaveisJson)}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="ativa"
                    defaultChecked={m.ativa}
                  />
                  Ativa
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <Button type="submit" variant="secondary">
                  Salvar alterações
                </Button>
              </div>
            </form>
          ))}
        </div>
      )}
    </ModuloShell>
  );
}
