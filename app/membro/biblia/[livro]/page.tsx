import Link from "next/link";
import { notFound } from "next/navigation";
import { getLivro } from "@/lib/biblia";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ livro: string }>;
}) {
  const { livro } = await params;
  const l = getLivro(livro);
  return { title: l ? l.nome : "Bíblia" };
}

export default async function LivroIndex({
  params,
}: {
  params: Promise<{ livro: string }>;
}) {
  const { livro } = await params;
  const l = getLivro(livro);
  if (!l) notFound();

  const caps = Array.from({ length: l.capitulos }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <Link
        href="/membro/biblia"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Bíblia
      </Link>

      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {l.testamento === "AT" ? "Antigo" : "Novo"} Testamento
        </p>
        <h1 className="mt-1 text-2xl font-bold">{l.nome}</h1>
        <p className="text-sm text-muted-foreground">{l.capitulos} capítulos</p>
      </header>

      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {caps.map((c) => (
          <li key={c}>
            <Link
              href={`/membro/biblia/${l.slug}/${c}`}
              className="flex aspect-square items-center justify-center rounded-xl border border-border bg-card text-sm font-medium hover:border-primary/40 hover:bg-secondary/40"
            >
              {c}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
