import Link from "next/link";

type Stat = { label: string; valor: string | number; ref?: string };

export function ModuloShell({
  titulo,
  descricao,
  stats,
  acoes,
  faseRoadmap,
  children,
}: {
  titulo: string;
  descricao: string;
  stats?: Stat[];
  acoes?: { href: string; label: string }[];
  faseRoadmap?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{descricao}</p>
        </div>
        {acoes && (
          <div className="flex flex-wrap gap-2">
            {acoes.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {stats && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-3xl font-semibold">{s.valor}</div>
              {s.ref && <div className="mt-1 text-xs text-muted-foreground">{s.ref}</div>}
            </div>
          ))}
        </div>
      )}

      {children}

      {faseRoadmap && (
        <section className="rounded-2xl border border-dashed border-border bg-accent/20 p-5">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Roadmap
          </div>
          <p className="mt-2 text-sm">{faseRoadmap}</p>
        </section>
      )}
    </div>
  );
}
