export const metadata = { title: "Testemunhos" };

export default function TestemunhosPublicosPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
          O que Deus tem feito
        </p>
        <h1 className="text-3xl font-bold">Testemunhos da família Maranata</h1>
        <p className="mt-1 text-muted-foreground">
          Vidas transformadas por Cristo nas 15 unidades.
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
        654 testemunhos foram capturados na auditoria. F7 traz a área pública.
      </div>
    </div>
  );
}
