import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brl, dataPtBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await prisma.campanha.findUnique({ where: { slug }, select: { titulo: true } });
  return { title: c?.titulo ?? "Doar" };
}

export default async function DoarCampanhaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campanha = await prisma.campanha.findUnique({
    where: { slug },
    include: { igreja: { select: { nome: true } } },
  });

  if (!campanha || !campanha.ativa) notFound();

  const arrec = Number(campanha.arrecadado);
  const meta = campanha.meta ? Number(campanha.meta) : null;
  const pct = meta ? Math.min(100, (arrec / meta) * 100) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/doar" className="text-sm text-muted-foreground hover:text-primary">
        ← Voltar
      </Link>

      <header>
        <h1 className="text-3xl font-bold">{campanha.titulo}</h1>
        <p className="mt-1 text-muted-foreground">
          {campanha.igreja?.nome ?? "Todas as unidades"}
          {campanha.fim && ` · até ${dataPtBR(campanha.fim)}`}
        </p>
      </header>

      {campanha.descricao && (
        <p className="text-muted-foreground">{campanha.descricao}</p>
      )}

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Arrecadado</div>
            <div className="mt-1 text-3xl font-bold">{brl(arrec)}</div>
          </div>
          {meta && (
            <div className="text-right">
              <div className="text-xs uppercase text-muted-foreground">Meta</div>
              <div className="mt-1 text-xl font-medium">{brl(meta)}</div>
            </div>
          )}
        </div>
        {pct != null && (
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      <form
        action="/api/doacoes/criar"
        method="POST"
        className="space-y-4 rounded-3xl border border-border bg-card p-6"
      >
        <input type="hidden" name="campanhaId" value={campanha.id} />
        <h2 className="text-lg font-semibold">Sua contribuição</h2>

        <input
          type="number"
          step="0.01"
          min="1"
          name="valor"
          placeholder="Valor (R$)"
          required
          className="w-full rounded-xl border border-input bg-background px-3 py-2"
        />
        <input
          type="text"
          name="nome"
          placeholder="Seu nome"
          required
          className="w-full rounded-xl border border-input bg-background px-3 py-2"
        />
        <input
          type="email"
          name="email"
          placeholder="Seu e-mail"
          required
          className="w-full rounded-xl border border-input bg-background px-3 py-2"
        />
        <button className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground hover:opacity-90">
          Doar agora
        </button>
      </form>
    </div>
  );
}
