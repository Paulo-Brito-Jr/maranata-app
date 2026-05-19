import Link from "next/link";
import { redirect } from "next/navigation";
import { getSafe2PayMode } from "@/lib/safe2pay";

interface Props {
  searchParams: Promise<{ ref?: string; tx?: string; sub?: string }>;
}

export default async function CheckoutStubPage({ searchParams }: Props) {
  if (getSafe2PayMode() !== "stub") {
    redirect("/doar");
  }

  const sp = await searchParams;
  const ref = sp.ref ?? "";
  const tx = sp.tx ?? sp.sub ?? "";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col gap-6 px-6 py-16">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-amber-100/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-amber-200">
          Checkout simulado
        </span>
        <h1 className="text-3xl font-semibold">Safe2Pay em modo stub</h1>
        <p className="text-sm text-foreground/70">
          O sistema está configurado sem credenciais Safe2Pay. Esta página simula o checkout para validar o fluxo
          end-to-end. Em produção, o usuário seria redirecionado para o checkout real do Safe2Pay.
        </p>
      </header>

      <section className="rounded-lg border border-foreground/10 bg-foreground/5 p-5 text-sm">
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-foreground/60">Referência</dt>
            <dd className="font-mono">{ref || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Transação/Assinatura</dt>
            <dd className="font-mono">{tx || "—"}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-3">
        <Link
          href={`/doar/obrigado?ref=${encodeURIComponent(ref)}`}
          className="rounded-md bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950 hover:bg-amber-400"
        >
          Simular pagamento bem-sucedido
        </Link>
        <Link
          href="/doar"
          className="rounded-md border border-foreground/20 px-4 py-2 text-center text-sm hover:bg-foreground/5"
        >
          Voltar
        </Link>
      </div>

      <p className="text-xs text-foreground/50">
        Para habilitar o checkout real, defina <code>SAFE2PAY_API_KEY</code>, <code>SAFE2PAY_TOKEN</code> e{" "}
        <code>SAFE2PAY_WEBHOOK_SECRET</code> nas variáveis de ambiente e remova <code>SAFE2PAY_MODE=stub</code>.
      </p>
    </main>
  );
}
