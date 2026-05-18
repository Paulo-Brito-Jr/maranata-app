export const metadata = { title: "Seja parceiro" };

export default function DoarPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
          Trazei todos os dízimos à casa do tesouro
        </p>
        <h1 className="mt-2 text-3xl font-bold">Seja parceiro da Maranata</h1>
        <p className="mt-2 text-muted-foreground">
          Sua semente honra a Deus e sustenta a obra. Doe uma vez ou mensalmente, com
          poucos cliques.
        </p>
      </header>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-brand-orange/10">
        <div className="grid gap-3">
          {[30, 50, 100, 200, 500].map((v) => (
            <button
              key={v}
              type="button"
              className="rounded-2xl border border-border bg-secondary px-5 py-4 text-left text-lg font-semibold transition hover:border-primary hover:bg-primary/10"
              disabled
            >
              R$ {v.toLocaleString("pt-BR")} <span className="text-sm font-normal text-muted-foreground">— mensal</span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Integração Safe2Pay (F2) — ativar via painel.
        </p>
      </div>
    </div>
  );
}
