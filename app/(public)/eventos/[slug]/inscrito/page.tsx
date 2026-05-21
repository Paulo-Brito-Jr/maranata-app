import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Inscrição confirmada" };
export const dynamic = "force-dynamic";

export default async function InscritoPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; pl?: string }>;
}) {
  const { ref, pl } = await searchParams;

  const pagamentoLocal = pl
    ? await prisma.pagamentoLocal.findUnique({
        where: { id: pl },
        include: {
          igreja: {
            select: { nome: true, apelido: true, endereco: true, telefone: true },
          },
        },
      })
    : null;

  const ehDinheiroLocal = !!pagamentoLocal;

  return (
    <div className="mx-auto max-w-md space-y-6 py-10 text-center">
      <div
        className={`mx-auto size-16 rounded-full text-4xl leading-[64px] ${
          ehDinheiroLocal ? "bg-amber-500/20" : "bg-success/20"
        }`}
      >
        {ehDinheiroLocal ? "⏳" : "✓"}
      </div>

      {ehDinheiroLocal ? (
        <>
          <h1 className="text-3xl font-bold">Vaga reservada!</h1>
          <p className="text-muted-foreground">
            Sua inscrição fica reservada por <strong>até 48 horas</strong>. Vá até
            a unidade abaixo e diga que veio pagar pelo evento.
          </p>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-left">
            <p className="text-xs font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Onde pagar
            </p>
            <p className="mt-2 text-lg font-semibold">
              IME Maranata —{" "}
              {pagamentoLocal!.igreja.apelido ?? pagamentoLocal!.igreja.nome}
            </p>
            {pagamentoLocal!.igreja.endereco && (
              <p className="mt-1 text-sm text-muted-foreground">
                📍 {pagamentoLocal!.igreja.endereco}
              </p>
            )}
            {pagamentoLocal!.igreja.telefone && (
              <p className="mt-1 text-sm text-muted-foreground">
                ☎️ {pagamentoLocal!.igreja.telefone}
              </p>
            )}
            <hr className="my-3 border-amber-500/20" />
            <p className="text-sm">
              Valor:{" "}
              <strong>R$ {Number(pagamentoLocal!.valor).toFixed(2)}</strong>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Referência: <code>{pagamentoLocal!.id.slice(-8)}</code>
            </p>
          </div>

          <form
            action={`/api/pagamento-local/${pagamentoLocal!.id}/informar`}
            method="POST"
            className="space-y-2"
          >
            <button className="w-full rounded-full bg-primary py-3 font-medium text-primary-foreground hover:opacity-90">
              Já paguei — avisar a unidade
            </button>
            <p className="text-xs text-muted-foreground">
              Clique somente depois de ir lá pessoalmente. O responsável valida.
            </p>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold">Inscrição confirmada!</h1>
          <p className="text-muted-foreground">
            Você receberá um e-mail com o QR code de entrada. Guarde a referência:
          </p>
          {ref && (
            <code className="inline-block rounded-xl bg-muted px-4 py-2 text-sm">
              {ref}
            </code>
          )}
        </>
      )}

      <div>
        <Link
          href="/eventos"
          className="rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          Ver mais eventos
        </Link>
      </div>
    </div>
  );
}
