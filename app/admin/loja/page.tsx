import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { brl } from "@/lib/utils";
import { Field, Input, Select, Textarea, Button } from "@/components/ui/field";
import {
  criarProdutoAction,
  alterarStatusProdutoAction,
  excluirProdutoAction,
  criarCategoriaAction,
  toggleCategoriaAtivaAction,
  excluirCategoriaAction,
} from "./actions";

export const metadata = { title: "Loja" };
export const dynamic = "force-dynamic";

type SearchParams = { aba?: "produtos" | "categorias" | "pedidos" };

const STATUS_BADGE: Record<string, { label: string; cor: string }> = {
  ATIVO: { label: "Ativo", cor: "bg-emerald-500/20 text-emerald-300" },
  RASCUNHO: { label: "Rascunho", cor: "bg-secondary/60 text-muted-foreground" },
  ESGOTADO: { label: "Esgotado", cor: "bg-amber-500/20 text-amber-300" },
  DESCONTINUADO: {
    label: "Descontinuado",
    cor: "bg-destructive/15 text-destructive",
  },
};

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const aba = params.aba ?? "produtos";

  const [produtos, categorias, pedidos, faturamento, totalAtivos] =
    await Promise.all([
      prisma.lojaProduto.findMany({
        include: { categoria: { select: { nome: true } } },
        orderBy: { criadoEm: "desc" },
        take: 100,
      }),
      prisma.lojaCategoria.findMany({
        include: { _count: { select: { produtos: true } } },
        orderBy: { ordem: "asc" },
      }),
      prisma.lojaPedido.count(),
      prisma.lojaPedido.aggregate({
        _sum: { total: true },
        where: { status: "PAGO" },
      }),
      prisma.lojaProduto.count({ where: { status: "ATIVO" } }),
    ]);

  return (
    <ModuloShell
      titulo="Loja Maranata"
      descricao="E-commerce próprio. Livros, devocionais, camisetas e produtos da família Maranata."
      stats={[
        {
          label: "Produtos ativos",
          valor: totalAtivos,
          ref: `${produtos.length} no total`,
        },
        { label: "Categorias", valor: categorias.length },
        { label: "Pedidos", valor: pedidos },
        {
          label: "Faturamento",
          valor: brl(Number(faturamento._sum.total ?? 0)),
        },
      ]}
    >
      <div className="mb-4 inline-flex rounded-full border border-border bg-card p-1 text-xs">
        {(["produtos", "categorias", "pedidos"] as const).map((opcao) => (
          <a
            key={opcao}
            href={`/admin/loja?aba=${opcao}`}
            className={`rounded-full px-3 py-1.5 capitalize transition ${
              aba === opcao
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opcao}
          </a>
        ))}
      </div>

      {aba === "produtos" && (
        <>
          <section className="mb-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-semibold">Novo produto</h2>
            <form action={criarProdutoAction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome" required>
                  <Input
                    name="nome"
                    required
                    placeholder="Devocional Diário 2026"
                  />
                </Field>
                <Field label="Slug (opcional, auto-gera)">
                  <Input name="slug" placeholder="devocional-diario-2026" />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Preço (R$)" required>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="preco"
                    required
                  />
                </Field>
                <Field label="Estoque (vazio = sem controle)">
                  <Input type="number" name="estoque" min="0" />
                </Field>
                <Field label="Status">
                  <Select name="status" defaultValue="RASCUNHO">
                    <option value="RASCUNHO">Rascunho</option>
                    <option value="ATIVO">Ativo (publicar)</option>
                  </Select>
                </Field>
              </div>
              {categorias.length > 0 && (
                <Field label="Categoria">
                  <Select name="categoriaId" defaultValue="">
                    <option value="">— Sem categoria —</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="Descrição">
                <Textarea name="descricao" rows={3} />
              </Field>
              <Button type="submit">Criar produto</Button>
            </form>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Catálogo ({produtos.length})
            </h2>
            {produtos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
                Sem produtos cadastrados. Crie acima.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {produtos.map((p) => {
                  const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.RASCUNHO;
                  return (
                    <article
                      key={p.id}
                      className="rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{p.nome}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${badge.cor}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      {p.categoria && (
                        <p className="text-xs text-muted-foreground">
                          {p.categoria.nome}
                        </p>
                      )}
                      <p className="mt-2 text-lg font-bold">
                        {brl(Number(p.preco))}
                      </p>
                      {p.precoPromocional && (
                        <p className="text-xs text-emerald-300">
                          promo: {brl(Number(p.precoPromocional))}
                        </p>
                      )}
                      {p.estoque !== null && (
                        <p className="text-xs text-muted-foreground">
                          Estoque: {p.estoque}
                        </p>
                      )}
                      {p.descricao && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {p.descricao}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1 text-xs">
                        {p.status !== "ATIVO" && (
                          <form
                            action={alterarStatusProdutoAction.bind(
                              null,
                              p.id,
                              "ATIVO",
                            )}
                          >
                            <button className="rounded-full bg-emerald-500/20 px-3 py-1 font-medium text-emerald-300">
                              Publicar
                            </button>
                          </form>
                        )}
                        {p.status === "ATIVO" && (
                          <form
                            action={alterarStatusProdutoAction.bind(
                              null,
                              p.id,
                              "RASCUNHO",
                            )}
                          >
                            <button className="rounded-full bg-secondary/60 px-3 py-1">
                              Despublicar
                            </button>
                          </form>
                        )}
                        <form
                          action={alterarStatusProdutoAction.bind(
                            null,
                            p.id,
                            "ESGOTADO",
                          )}
                        >
                          <button className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-300">
                            Esgotado
                          </button>
                        </form>
                        <form action={excluirProdutoAction.bind(null, p.id)}>
                          <button className="rounded-full bg-destructive/15 px-3 py-1 text-destructive">
                            Excluir
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {aba === "categorias" && (
        <>
          <section className="mb-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-semibold">Nova categoria</h2>
            <form action={criarCategoriaAction} className="flex gap-2">
              <Input name="nome" placeholder="Livros · Camisetas · Devocionais" />
              <Button type="submit">Adicionar</Button>
            </form>
          </section>

          {categorias.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
              Nenhuma categoria. Crie pra organizar produtos.
            </div>
          ) : (
            <div className="space-y-2">
              {categorias.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 ${
                    c.ativa ? "border-border" : "border-border/40 opacity-60"
                  }`}
                >
                  <div>
                    <p className="font-medium">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c._count.produtos} produto(s) · {c.slug}
                    </p>
                  </div>
                  <div className="flex gap-1 text-xs">
                    <form
                      action={toggleCategoriaAtivaAction.bind(
                        null,
                        c.id,
                        !c.ativa,
                      )}
                    >
                      <button className="rounded-full bg-secondary/60 px-3 py-1">
                        {c.ativa ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                    <form action={excluirCategoriaAction.bind(null, c.id)}>
                      <button
                        className="rounded-full bg-destructive/15 px-3 py-1 text-destructive disabled:opacity-30"
                        disabled={c._count.produtos > 0}
                        title={
                          c._count.produtos > 0
                            ? "Categoria com produtos não pode ser excluída"
                            : ""
                        }
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {aba === "pedidos" && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          {pedidos === 0
            ? "Nenhum pedido ainda. Quando alguém comprar, aparece aqui."
            : `${pedidos} pedido(s) no banco. UI de pedidos pendente.`}
        </div>
      )}
    </ModuloShell>
  );
}
