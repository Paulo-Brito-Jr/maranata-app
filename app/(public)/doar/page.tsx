import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { brl } from "@/lib/utils";

export const metadata = { title: "Seja parceiro" };
export const dynamic = "force-dynamic";

const erros: Record<string, string> = {
  valor: "Informe um valor válido para continuar.",
  email: "Confira o e-mail informado.",
  checkout: "Não foi possível iniciar o pagamento agora. Tente novamente em instantes.",
  sede: "A igreja sede ainda não está configurada para receber doações.",
};

export default async function DoarPage({
  searchParams,
}: {
  searchParams?: Promise<{ err?: string }>;
}) {
  const params = await searchParams;
  const erro = params?.err ? erros[params.err] ?? "Não foi possível iniciar a doação." : null;
  const campanhas = await prisma.campanha.findMany({
    where: { ativa: true },
    orderBy: { criadaEm: "desc" },
    take: 6,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
          Trazei todos os dízimos à casa do tesouro
        </p>
        <h1 className="mt-2 text-3xl font-bold">Seja parceiro da Maranata</h1>
        <p className="mt-2 text-muted-foreground">
          Sua semente honra a Deus e sustenta a obra. Doe uma vez ou mensalmente.
        </p>
      </header>

      {erro && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      <form
        action="/api/doacoes/criar"
        method="POST"
        className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-brand-orange/10"
      >
        <h2 className="text-lg font-semibold">Quero contribuir</h2>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[30, 50, 100, 200, 500, 1000].map((v) => (
            <label
              key={v}
              className="cursor-pointer rounded-xl border border-border bg-secondary/50 px-3 py-3 text-center transition has-[input:checked]:border-primary has-[input:checked]:bg-primary/10"
            >
              <input type="radio" name="valor" value={v} defaultChecked={v === 100} className="sr-only" />
              <span className="text-lg font-semibold">R$ {v}</span>
            </label>
          ))}
        </div>

        <div className="mt-3">
          <label className="text-sm">Outro valor</label>
          <input
            type="number"
            step="0.01"
            min="1"
            name="valorAvulso"
            placeholder="Digite o valor"
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <label className="cursor-pointer rounded-xl border border-border bg-secondary/50 px-3 py-3 text-center has-[input:checked]:border-primary has-[input:checked]:bg-primary/10">
            <input type="radio" name="frequencia" value="AVULSA" defaultChecked className="sr-only" />
            <span>Uma vez</span>
          </label>
          <label className="cursor-pointer rounded-xl border border-border bg-secondary/50 px-3 py-3 text-center has-[input:checked]:border-primary has-[input:checked]:bg-primary/10">
            <input type="radio" name="frequencia" value="MENSAL" className="sr-only" />
            <span>Mensal</span>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">dízimo</span>
          </label>
          <label className="cursor-pointer rounded-xl border border-border bg-secondary/50 px-3 py-3 text-center has-[input:checked]:border-primary has-[input:checked]:bg-primary/10">
            <input type="radio" name="frequencia" value="ANUAL" className="sr-only" />
            <span>Anual</span>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">votos</span>
          </label>
        </div>

        <div className="mt-4 space-y-3">
          <input
            type="text"
            name="nome"
            placeholder="Seu nome"
            required
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            type="email"
            name="email"
            placeholder="Seu e-mail"
            required
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            type="tel"
            name="telefone"
            placeholder="Seu telefone (opcional)"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="documento"
            placeholder="CPF/CNPJ (opcional)"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded-full bg-primary py-3 font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90"
        >
          Continuar pra pagamento
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Processamento via Safe2Pay · seguro e auditado
        </p>
      </form>

      {campanhas.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Ou doe a uma campanha específica
          </h2>
          <div className="grid gap-3">
            {campanhas.map((c) => {
              const arrec = Number(c.arrecadado);
              const meta = c.meta ? Number(c.meta) : null;
              const pct = meta ? Math.min(100, (arrec / meta) * 100) : null;
              return (
                <Link
                  key={c.id}
                  href={`/doar/${c.slug}`}
                  className="block rounded-2xl border border-border bg-card p-5 hover:border-primary/40"
                >
                  <div className="font-semibold">{c.titulo}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {brl(arrec)}
                    {meta && ` de ${brl(meta)}`}
                  </div>
                  {pct != null && (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
