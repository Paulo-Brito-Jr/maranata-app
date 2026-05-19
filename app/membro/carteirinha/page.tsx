import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { dataPtBR } from "@/lib/utils";

export const metadata = { title: "Carteirinha" };
export const dynamic = "force-dynamic";

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function CarteirinhaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/carteirinha");

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    include: {
      igreja: { select: { nome: true } },
    },
  });

  const payload = JSON.stringify({
    tipo: "maranata-carteirinha",
    sub: user.sub,
    email: user.email,
    nome: user.name,
    matricula: membro?.inchurchId ?? membro?.id ?? user.sub,
    igreja: membro?.igreja.nome ?? "—",
    geradoEm: new Date().toISOString(),
  });

  const qrSvg = await QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#ffffff", light: "#00000000" },
    width: 220,
  });

  const matricula =
    membro?.inchurchId != null
      ? String(membro.inchurchId).padStart(6, "0")
      : (membro?.id ?? user.sub).slice(-6).toUpperCase();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Carteirinha digital</h1>
        <p className="text-sm text-muted-foreground">
          Mostre na entrada de eventos ou no check-in da célula.
        </p>
      </header>

      <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue via-brand-blue/90 to-brand-orange p-6 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_top_right,white_2px,transparent_2px)] [background-size:24px_24px]" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">
                IME Maranata
              </p>
              <p className="text-xs opacity-90">{membro?.igreja.nome ?? "—"}</p>
            </div>
            <div className="size-10 rounded-full bg-white/15 backdrop-blur" />
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl font-bold backdrop-blur">
              {iniciais(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight">{user.name}</p>
              <p className="truncate text-xs opacity-80">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="opacity-70">Matrícula</p>
              <p className="font-mono text-sm font-semibold">{matricula}</p>
            </div>
            {membro?.dataBatismo && (
              <div>
                <p className="opacity-70">Batismo</p>
                <p className="text-sm font-semibold">{dataPtBR(membro.dataBatismo)}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center rounded-2xl bg-black/25 p-4 backdrop-blur">
            <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
          </div>

          <p className="mt-3 text-center text-[10px] opacity-70">
            Gerado em {new Date().toLocaleString("pt-BR")} · válido nesta sessão
          </p>
        </div>
      </article>

      <p className="text-center text-xs text-muted-foreground">
        Em breve: salvar no Apple/Google Wallet.
      </p>
    </div>
  );
}
