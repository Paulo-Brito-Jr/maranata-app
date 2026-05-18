export const metadata = { title: "Eventos" };

export default function EventosPublicosPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Eventos da Maranata</h1>
        <p className="mt-1 text-muted-foreground">
          Celebrações, conferências e encontros nas 15 unidades.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
          Lista de eventos virá da F3.
        </article>
      </div>
    </div>
  );
}
