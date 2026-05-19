import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { dataPtBR } from "@/lib/utils";
import {
  enviarPushAgoraAction,
  excluirPushAction,
} from "./actions";
import { PushComposer } from "./push-composer";

export const metadata = { title: "Comunicação" };
export const dynamic = "force-dynamic";

export default async function PushPage() {
  const [
    pushes,
    totalAssinantes,
    totalUsuarios,
    igrejas,
    celulas,
    templates,
  ] = await Promise.all([
    prisma.pushNotification.findMany({
      orderBy: { criadoEm: "desc" },
      take: 30,
      include: { template: { select: { nome: true } } },
    }),
    prisma.pushSubscription.count({ where: { ativa: true } }),
    prisma.usuarioApp.count(),
    prisma.igreja.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.celula.findMany({
      select: { id: true, nome: true },
      where: { status: "ATIVA" },
      orderBy: { nome: "asc" },
      take: 50,
    }),
    prisma.pushTemplate.findMany({
      where: { ativo: true },
      orderBy: { usos: "desc" },
      select: { id: true, nome: true, titulo: true, corpo: true, url: true, alvoPadrao: true },
    }),
  ]);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const enviadosMes = pushes.filter((p) => p.enviadoEm && p.enviadoEm >= inicioMes).length;
  const aguardando = pushes.filter((p) => !p.enviadoEm).length;

  return (
    <ModuloShell
      titulo="Comunicação"
      descricao="Push notifications + e-mail (Resend) + WhatsApp template (Meta). Segmentação por papel, igreja e célula."
      stats={[
        {
          label: "Inscritos no push",
          valor: totalAssinantes,
          ref: `${totalUsuarios} usuários cadastrados`,
        },
        { label: "Enviados (mês)", valor: enviadosMes },
        { label: "Aguardando", valor: aguardando },
        { label: "Templates ativos", valor: templates.length },
      ]}
      acoes={[{ href: "/admin/push/templates", label: "Templates" }]}
    >
      <PushComposer igrejas={igrejas} celulas={celulas} templates={templates} />

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Histórico
        </h2>
        {pushes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum push criado.</p>
        ) : (
          <div className="space-y-2">
            {pushes.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{p.titulo}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {dataPtBR(p.criadoEm)}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">{p.corpo}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-secondary/60 px-2 py-0.5">{p.alvo}</span>
                  {p.template && (
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-300">
                      template: {p.template.nome}
                    </span>
                  )}
                  {p.agendadoPara && !p.enviadoEm && (
                    <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-cyan-300">
                      📅 {dataPtBR(p.agendadoPara)}
                    </span>
                  )}
                  {p.enviadoEm ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                      ✓ enviado · {p.totalEnviado} entregues
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300">
                      ⏳ rascunho
                    </span>
                  )}
                  <div className="ml-auto flex gap-1">
                    {!p.enviadoEm && (
                      <form action={enviarPushAgoraAction.bind(null, p.id)}>
                        <button
                          className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          type="submit"
                        >
                          Enviar agora
                        </button>
                      </form>
                    )}
                    <form action={excluirPushAction.bind(null, p.id)}>
                      <button
                        className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive hover:bg-destructive/25"
                        type="submit"
                      >
                        Excluir
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        E-mail Resend e WhatsApp Cloud API: configure{" "}
        <code className="rounded bg-secondary/60 px-1">RESEND_API_KEY</code> e{" "}
        <code className="rounded bg-secondary/60 px-1">WHATSAPP_TOKEN</code> nas envs Vercel pra
        ativar envio real.{" "}
        <Link href="/admin/push/templates" className="text-primary underline">
          Gerenciar templates
        </Link>
      </p>
    </ModuloShell>
  );
}
