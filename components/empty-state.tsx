import Link from "next/link";

export function EmptyState({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold">{titulo}</h3>
      {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      {acao && (
        <Link
          href={acao.href}
          className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {acao.label}
        </Link>
      )}
    </div>
  );
}
