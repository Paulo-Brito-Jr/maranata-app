import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Button } from "@/components/ui/field";
import {
  criarSubnomenclaturaAction,
  atualizarSubnomenclaturaAction,
  excluirSubnomenclaturaAction,
} from "./actions";

export const metadata = { title: "Nomenclatura" };
export const dynamic = "force-dynamic";

const SUGERIDOS: { chave: string; padrao: string; contexto: string }[] = [
  { chave: "celula", padrao: "Célula", contexto: "Grupos pequenos" },
  { chave: "rede", padrao: "Rede", contexto: "Agrupamento de células" },
  {
    chave: "material_apoio",
    padrao: "Material",
    contexto: "Conteúdo para líderes de célula",
  },
  { chave: "membro", padrao: "Membro", contexto: "Pessoa cadastrada" },
  { chave: "visitante", padrao: "Visitante", contexto: "Pessoa não-membro" },
  {
    chave: "pedido_oracao",
    padrao: "Pedido de oração",
    contexto: "Intercessão",
  },
  { chave: "pregacao", padrao: "Pregação", contexto: "Mídia de pregação" },
];

export default async function NomenclaturaPage() {
  const itens = await prisma.subnomenclatura.findMany({
    orderBy: { chave: "asc" },
  });

  const existentes = new Set(itens.map((i) => i.chave));
  const sugeridosFaltando = SUGERIDOS.filter((s) => !existentes.has(s.chave));

  return (
    <ModuloShell
      titulo="Nomenclatura customizada"
      descricao="Renomeie os termos do app para combinar com o vocabulário da Maranata. O valor customizado substitui o padrão InChurch."
      stats={[
        { label: "Termos customizados", valor: itens.length },
        { label: "Sugeridos disponíveis", valor: sugeridosFaltando.length },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold">
          Adicionar / atualizar nomenclatura
        </h3>
        <form
          action={criarSubnomenclaturaAction}
          className="grid gap-3 md:grid-cols-2"
        >
          <Field label="Chave (snake_case)" required>
            <Input name="chave" placeholder="material_apoio" required />
          </Field>
          <Field label="Padrão (InChurch)" required>
            <Input name="padrao" placeholder="Material" required />
          </Field>
          <Field label="Customizado (Maranata)" required>
            <Input
              name="customizado"
              placeholder="Material de apoio"
              required
            />
          </Field>
          <Field label="Contexto / onde aparece">
            <Input
              name="contexto"
              placeholder="Ex: tela de líderes de célula"
            />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </section>

      {sugeridosFaltando.length > 0 && (
        <section className="rounded-2xl border border-dashed border-border bg-accent/10 p-5">
          <h3 className="mb-3 text-sm font-semibold">Sugestões para começar</h3>
          <ul className="grid gap-2 md:grid-cols-2">
            {sugeridosFaltando.map((s) => (
              <li
                key={s.chave}
                className="rounded-xl border border-border/40 bg-card p-3 text-xs"
              >
                <p className="font-mono">{s.chave}</p>
                <p className="text-muted-foreground">
                  Padrão: <strong>{s.padrao}</strong>
                </p>
                <p className="text-muted-foreground">{s.contexto}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Termos customizados ({itens.length})
        </h2>
        {itens.length === 0 ? (
          <EmptyState
            titulo="Nenhuma nomenclatura customizada"
            descricao="Use o formulário acima para criar a primeira."
          />
        ) : (
          <div className="space-y-3">
            {itens.map((item) => (
              <form
                key={item.id}
                action={atualizarSubnomenclaturaAction}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="chave" value={item.chave} />
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground">
                    {item.chave}
                  </p>
                  <button
                    formAction={excluirSubnomenclaturaAction.bind(null, item.id)}
                    className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive hover:bg-destructive/25"
                  >
                    Excluir
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Padrão (InChurch)">
                    <Input name="padrao" defaultValue={item.padrao} />
                  </Field>
                  <Field label="Customizado (Maranata)">
                    <Input
                      name="customizado"
                      defaultValue={item.customizado}
                    />
                  </Field>
                  <Field label="Contexto" className="md:col-span-2">
                    <Input
                      name="contexto"
                      defaultValue={item.contexto ?? ""}
                      placeholder="Onde esse termo aparece"
                    />
                  </Field>
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
      </section>
    </ModuloShell>
  );
}
