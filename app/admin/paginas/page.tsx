import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Textarea, Button } from "@/components/ui/field";
import {
  criarPaginaAction,
  atualizarPaginaAction,
  togglePaginaPublicadaAction,
  excluirPaginaAction,
} from "./actions";

export const metadata = { title: "Páginas multiuso" };
export const dynamic = "force-dynamic";

export default async function PaginasPage() {
  const paginas = await prisma.paginaMultiuso.findMany({
    orderBy: { slug: "asc" },
  });

  const publicadas = paginas.filter((p) => p.publicada).length;

  return (
    <ModuloShell
      titulo="Páginas multiuso"
      descricao="Conteúdo institucional editável em markdown — sobre, contato, política de privacidade, perguntas frequentes."
      stats={[
        { label: "Páginas", valor: paginas.length },
        { label: "Publicadas", valor: publicadas },
      ]}
    >
      <details className="rounded-2xl border border-border bg-card p-5" open>
        <summary className="cursor-pointer text-sm font-semibold">
          Criar nova página
        </summary>
        <form action={criarPaginaAction} className="mt-4 grid gap-3">
          <Field
            label="Slug"
            hint="URL final (ex: /p/sobre-nos). Letras minúsculas, hífens"
            required
          >
            <Input name="slug" placeholder="sobre-nos" required />
          </Field>
          <Field label="Título" required>
            <Input
              name="titulo"
              placeholder="Sobre a Maranata"
              required
            />
          </Field>
          <Field
            label="Conteúdo (markdown)"
            hint="Suporta # cabeçalhos, **negrito**, listas, links"
            required
          >
            <Textarea
              name="conteudo"
              rows={10}
              placeholder={"# Sobre nós\n\nA Igreja Maranata é..."}
              required
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="publicada" />
            Publicada (visível no site)
          </label>
          <div>
            <Button type="submit">Criar página</Button>
          </div>
        </form>
      </details>

      {paginas.length === 0 ? (
        <EmptyState
          titulo="Nenhuma página cadastrada"
          descricao="Use o formulário acima para criar a primeira."
        />
      ) : (
        <div className="space-y-3">
          {paginas.map((p) => (
            <form
              key={p.id}
              action={atualizarPaginaAction}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="slug" value={p.slug} />
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-muted-foreground">
                  /{p.slug}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    formAction={togglePaginaPublicadaAction.bind(
                      null,
                      p.id,
                      !p.publicada,
                    )}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      p.publicada
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-secondary/60 text-muted-foreground"
                    }`}
                  >
                    {p.publicada ? "✓ Publicada" : "Rascunho"}
                  </button>
                  <button
                    formAction={excluirPaginaAction.bind(null, p.id)}
                    className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive hover:bg-destructive/25"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                <Field label="Título">
                  <Input name="titulo" defaultValue={p.titulo} />
                </Field>
                <Field label="Conteúdo (markdown)">
                  <Textarea
                    name="conteudo"
                    rows={10}
                    defaultValue={p.conteudo}
                    className="font-mono text-xs"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="publicada"
                    defaultChecked={p.publicada}
                  />
                  Publicada
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
