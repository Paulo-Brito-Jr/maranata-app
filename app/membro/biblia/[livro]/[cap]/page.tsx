import Link from "next/link";
import { notFound } from "next/navigation";
import { carregarCapitulo, getLivro } from "@/lib/biblia";
import { ArrowLeft, ChevronLeft, ChevronRight, Share2 } from "lucide-react";

export const dynamic = "force-static";
export const revalidate = 31_536_000;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ livro: string; cap: string }>;
}) {
  const { livro, cap } = await params;
  const l = getLivro(livro);
  return { title: l ? `${l.nome} ${cap}` : "Bíblia" };
}

export default async function CapituloPage({
  params,
}: {
  params: Promise<{ livro: string; cap: string }>;
}) {
  const { livro, cap } = await params;
  const livroObj = getLivro(livro);
  if (!livroObj) notFound();
  const capNum = Number(cap);
  if (!Number.isInteger(capNum) || capNum < 1 || capNum > livroObj.capitulos) notFound();

  const dados = await carregarCapitulo(livro, capNum);

  const anterior = capNum > 1 ? capNum - 1 : null;
  const proximo = capNum < livroObj.capitulos ? capNum + 1 : null;

  return (
    <div className="space-y-5">
      <Link
        href={`/membro/biblia/${livro}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> {livroObj.nome}
      </Link>

      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {livroObj.abreviacao} {capNum}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold">
            {livroObj.nome} {capNum}
          </h1>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Leia ${livroObj.nome} ${capNum}\nhttps://maranata.app/membro/biblia/${livro}/${capNum}`)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary"
        >
          <Share2 className="size-3" /> Compartilhar
        </a>
      </header>

      <article className="space-y-3 text-base leading-relaxed">
        {!dados || dados.versiculos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            Não foi possível carregar este capítulo agora. Tente de novo em alguns segundos.
          </p>
        ) : (
          dados.versiculos.map((v) => (
            <p key={v.numero} id={`v${v.numero}`} className="scroll-mt-20">
              <sup className="mr-1 text-xs font-bold text-primary">{v.numero}</sup>
              {v.texto}
            </p>
          ))
        )}
      </article>

      <nav className="flex items-center justify-between border-t border-border pt-4">
        {anterior ? (
          <Link
            href={`/membro/biblia/${livro}/${anterior}`}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
          >
            <ChevronLeft className="size-4" /> Cap. {anterior}
          </Link>
        ) : (
          <span />
        )}
        {proximo ? (
          <Link
            href={`/membro/biblia/${livro}/${proximo}`}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
          >
            Cap. {proximo} <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {dados && (
        <p className="text-center text-xs text-muted-foreground">
          Texto: {dados.fonte}
        </p>
      )}
    </div>
  );
}
