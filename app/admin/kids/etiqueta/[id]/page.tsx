import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Etiqueta Kids" };
export const dynamic = "force-dynamic";

export default async function EtiquetaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const checkin = await prisma.kidsCheckin.findUnique({
    where: { id },
    include: {
      crianca: {
        include: {
          responsaveis: { where: { podeBuscar: true }, orderBy: { principal: "desc" } },
        },
      },
      turma: { include: { igreja: { select: { nome: true } } } },
    },
  });
  if (!checkin) notFound();

  const qrSvg = await QRCode.toString(checkin.etiquetaCode, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#000", light: "#fff" },
    width: 180,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/admin/kids"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Voltar
        </Link>
        <div className="flex gap-2">
          <Link
            href="/admin/kids/checkin"
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary"
          >
            Novo check-in
          </Link>
          <Link
            href={`/admin/kids/sala/${checkin.turmaId}`}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary"
          >
            Ver sala
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-md space-y-3 rounded-2xl border-2 border-dashed border-border bg-white p-5 text-black shadow-xl print:border-black print:shadow-none">
        <header className="text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-black/60">
            IME Maranata · {checkin.turma.igreja.nome}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{checkin.crianca.nome}</h1>
          <p className="text-xs">
            {checkin.turma.nome} · {checkin.crianca.faixaEtaria}
            {checkin.turma.sala && ` · sala ${checkin.turma.sala}`}
          </p>
        </header>

        {(checkin.crianca.alergias ||
          checkin.crianca.restricoesAlim ||
          checkin.crianca.necessidadesEsp) && (
          <div className="rounded-lg border-2 border-red-600 bg-red-50 p-3 text-sm text-red-900">
            <p className="font-bold uppercase tracking-widest">⚠ Atenção</p>
            {checkin.crianca.alergias && <p>Alergias: {checkin.crianca.alergias}</p>}
            {checkin.crianca.restricoesAlim && (
              <p>Alimentação: {checkin.crianca.restricoesAlim}</p>
            )}
            {checkin.crianca.necessidadesEsp && (
              <p>Necessidades: {checkin.crianca.necessidadesEsp}</p>
            )}
          </div>
        )}

        {checkin.crianca.responsaveis.length > 0 && (
          <div className="rounded-lg border border-black/20 bg-black/5 p-3 text-xs">
            <p className="font-bold uppercase tracking-widest">Pode buscar</p>
            <ul className="mt-1 space-y-0.5">
              {checkin.crianca.responsaveis.map((r) => (
                <li key={r.id}>
                  {r.principal && "★ "}
                  <strong>{r.nome}</strong> ({r.parentesco})
                  {r.telefone && ` · ${r.telefone}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center">
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
        </div>

        <div className="text-center">
          <p className="font-mono text-lg font-bold">{checkin.etiquetaCode.slice(-8).toUpperCase()}</p>
          <p className="text-[10px] uppercase tracking-widest text-black/60">
            ticket de retirada
          </p>
        </div>

        <footer className="border-t border-black/20 pt-2 text-center text-[10px] text-black/60">
          Entrada: {dataPtBR(checkin.entradaEm)} ·{" "}
          {checkin.entradaEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          <br />
          Sem o ticket QR, a criança não pode ser retirada.
        </footer>
      </article>

      <div className="text-center print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          type="button"
        >
          🖨 Imprimir etiqueta
        </button>
      </div>

      <p className="text-center text-xs text-muted-foreground print:hidden">
        Mostre essa página em qualquer dispositivo na hora da retirada — o QR funciona offline.
      </p>
    </div>
  );
}
