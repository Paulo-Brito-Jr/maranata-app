import Link from "next/link";
import { Download as DownloadIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { registrarDownload } from "./actions";

export const metadata = { title: "Downloads" };
export const dynamic = "force-dynamic";

type SearchParams = { cat?: string };

export default async function DownloadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { cat } = await searchParams;

  const where = cat ? { categoria: cat } : {};
  const [downloads, categorias] = await Promise.all([
    prisma.download.findMany({
      where,
      orderBy: [{ downloads: "desc" }, { criadoEm: "desc" }],
      take: 300,
    }),
    prisma.download.findMany({
      where: { categoria: { not: null } },
      distinct: ["categoria"],
      select: { categoria: true },
      orderBy: { categoria: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <DownloadIcon className="mx-auto size-8 text-primary" />
        <h1 className="mt-3 text-3xl font-bold">Downloads</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Materiais, estudos, devocionais e mídias da igreja.
        </p>
      </header>

      {categorias.length > 0 && (
        <nav className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <Link
            href="/downloads"
            className={`rounded-full px-3 py-1 transition ${
              !cat
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card hover:border-primary/40"
            }`}
          >
            Todos
          </Link>
          {categorias
            .filter(
              (c): c is { categoria: string } =>
                typeof c.categoria === "string" && c.categoria.length > 0,
            )
            .map((c) => (
              <Link
                key={c.categoria}
                href={`/downloads?cat=${encodeURIComponent(c.categoria)}`}
                className={`rounded-full px-3 py-1 transition ${
                  cat === c.categoria
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card hover:border-primary/40"
                }`}
              >
                {c.categoria}
              </Link>
            ))}
        </nav>
      )}

      {downloads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          Nenhum download disponível {cat ? "nessa categoria" : "ainda"}.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {downloads.map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                {d.categoria && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {d.categoria}
                  </p>
                )}
                <p className="mt-1 font-semibold leading-tight">{d.titulo}</p>
                {d.descricao && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {d.descricao}
                  </p>
                )}
                {d.downloads > 0 && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {d.downloads} download{d.downloads === 1 ? "" : "s"}
                  </p>
                )}
              </div>
              <form action={registrarDownload} className="shrink-0">
                <input type="hidden" name="id" value={d.id} />
                <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90">
                  <DownloadIcon className="size-3.5" /> Baixar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
