import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brl, dataPtBR } from "@/lib/utils";

export const metadata = { title: "Campanha" };

export default async function CampanhaDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.campanha.findUnique({
    where: { id },
    include: {
      igreja: { select: { nome: true } },
      doacoes: {
        where: { status: "PAGA" },
        orderBy: { criadaEm: "desc" },
        take: 20,
      },
    },
  });

  if (!c) notFound();

  const arrec = Number(c.arrecadado);
  const meta = c.meta ? Number(c.meta) : null;
  const pct = meta ? Math.min(100, (arrec / meta) * 100) : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://maranata.app";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link
          href="/admin/financeiro/campanhas"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Voltar
        </Link>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{c.titulo}</h1>
            <p className="text-muted-foreground">
              {c.igreja?.nome ?? "Todas as unidades"}
              {c.fim && ` · termina ${dataPtBR(c.fim)}`}
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Arrecadado</div>
            <div className="mt-1 text-4xl font-bold">{brl(arrec)}</div>
          </div>
          {meta && (
            <div className="text-right">
              <div className="text-xs uppercase text-muted-foreground">Meta</div>
              <div className="mt-1 text-2xl font-medium">{brl(meta)}</div>
            </div>
          )}
        </div>
        {pct != null && (
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Link público
        </h2>
        <code className="mt-2 block break-all rounded-xl bg-muted px-3 py-2 text-sm">
          {appUrl}/doar/{c.slug}
        </code>
      </div>

      {c.descricao && <p className="text-sm">{c.descricao}</p>}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Últimas doações
        </h2>
        {c.doacoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem doações ainda.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {c.doacoes.map((d) => (
              <li key={d.id} className="flex items-center justify-between">
                <span>{d.nomeDoador}</span>
                <span className="font-medium">{brl(Number(d.valor))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
