import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Button } from "@/components/ui/field";
import { dataPtBR } from "@/lib/utils";
import { toggleBannerAction, criarBannerAction, deletarBannerAction } from "./actions";

export const metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

export default async function AdminBanners() {
  const [banners, total, totalAtivos, totalCliques] = await Promise.all([
    prisma.banner.findMany({ orderBy: [{ ativo: "desc" }, { ordem: "asc" }, { criadoEm: "desc" }] }),
    prisma.banner.count(),
    prisma.banner.count({ where: { ativo: true } }),
    prisma.banner.aggregate({ _sum: { cliques: true } }),
  ]);

  const cliques = totalCliques._sum.cliques ?? 0;

  return (
    <ModuloShell
      titulo="Banners"
      descricao="Banners do carousel da homepage e telas internas. Ordem ascendente."
      stats={[
        { label: "Total", valor: total },
        { label: "Ativos", valor: totalAtivos },
        { label: "Cliques", valor: cliques },
      ]}
    >
      <details className="rounded-2xl border border-border bg-card p-5">
        <summary className="cursor-pointer text-sm font-semibold">Criar banner</summary>
        <form action={criarBannerAction} className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Título" required>
            <Input name="titulo" required />
          </Field>
          <Field label="Subtítulo">
            <Input name="subtitulo" />
          </Field>
          <Field label="Imagem URL">
            <Input name="imagemUrl" type="url" />
          </Field>
          <Field label="Link URL">
            <Input name="linkUrl" type="url" />
          </Field>
          <Field label="Ordem">
            <Input name="ordem" type="number" defaultValue={0} />
          </Field>
          <Field label="Início">
            <Input name="inicio" type="date" />
          </Field>
          <Field label="Fim">
            <Input name="fim" type="date" />
          </Field>
          <div className="flex items-end">
            <Button type="submit">Criar banner</Button>
          </div>
        </form>
      </details>

      <section className="space-y-2">
        {banners.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            Sem banners cadastrados ainda.
          </p>
        ) : (
          banners.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border bg-card p-4 ${
                b.ativo ? "border-border" : "border-border/30 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                {b.imagemUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.imagemUrl}
                    alt={b.titulo}
                    className="size-20 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{b.titulo}</h3>
                    <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                      ordem {b.ordem}
                    </span>
                    {b.cliques > 0 && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300">
                        {b.cliques} cliques
                      </span>
                    )}
                  </div>
                  {b.subtitulo && <p className="mt-1 text-xs text-muted-foreground">{b.subtitulo}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    {b.linkUrl && (
                      <a href={b.linkUrl} className="underline" target="_blank" rel="noopener noreferrer">
                        {b.linkUrl}
                      </a>
                    )}
                    {b.inicio && <span>inicia {dataPtBR(b.inicio)}</span>}
                    {b.fim && <span>termina {dataPtBR(b.fim)}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <form action={toggleBannerAction.bind(null, b.id, !b.ativo)}>
                    <button
                      type="submit"
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        b.ativo
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      {b.ativo ? "✓ Ativo" : "Desativado"}
                    </button>
                  </form>
                  <form action={deletarBannerAction.bind(null, b.id)}>
                    <button
                      type="submit"
                      className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </ModuloShell>
  );
}
