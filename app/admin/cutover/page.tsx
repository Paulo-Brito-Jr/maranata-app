import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Cutover InChurch" };
export const dynamic = "force-dynamic";

export default async function CutoverPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") notFound();

  // Coletar estatísticas pra ver se cutover está pronto
  const [
    totalMembros,
    totalUsuariosApp,
    totalEventos,
    totalLancamentos,
    eventosComLote,
    inscricoesPagas,
    pushTemplates,
  ] = await Promise.all([
    prisma.membro.count(),
    prisma.usuarioApp.count(),
    prisma.evento.count(),
    prisma.lancamentoFinanceiro.count(),
    prisma.evento.count({ where: { lotes: { some: { preco: { gt: 0 } } } } }),
    prisma.inscricaoEvento.count({ where: { metodoPagamento: { not: null } } }),
    prisma.pushTemplate.count({ where: { ativo: true } }),
  ]);

  // Estado das pendências
  const itens = [
    {
      id: "F03.1",
      titulo: "Safe2Pay credentials reais",
      status: "BLOQUEADO",
      bloqueador: "Paulo precisa solicitar no painel safe2pay.com",
      acao: "Acessar painel → API Keys → criar produção → copiar pra vault `SAFE2PAY_API_KEY_PROD`",
      info: `Hoje há ${inscricoesPagas} inscrições pagas registradas (PIX/Cartão só seta metodoPagamento, sem checkout real).`,
    },
    {
      id: "F21",
      titulo: "Comunicar 6.668 membros sobre cutover",
      status: "PRONTO_PRA_DISPARAR",
      bloqueador: "Paulo aprova lote → admin clica Enviar",
      acao: "Templates prontos em docs/cutover-comunicacao-membros.md. Push + WhatsApp + email + IG + banner + modal pré-escritos.",
      info: `${pushTemplates} push templates ativos. ${totalUsuariosApp} usuários alvo.`,
    },
    {
      id: "F22",
      titulo: "Treinar 42 admins",
      status: "MATERIAL_PRONTO",
      bloqueador: "Paulo agenda Zoom 60min",
      acao: "Roteiro completo em docs/cutover-treinamento-admins.md. Aborda sidebar, criar evento, gestão de membros, financeiro, kids check-in.",
      info: "42 admins ativos no /admin/usuarios.",
    },
    {
      id: "F23",
      titulo: "Cancelar contrato InChurch",
      status: "AGUARDA_F21_F22",
      bloqueador: "Só após F21+F22 concluídos",
      acao: "Ligar WhatsApp +55 21 99352-8752 (gerente comercial InChurch). Solicitar cancelamento + exportar último backup.",
      info: "Economia mensal estimada: contrato InChurch atual.",
    },
  ];

  const STATUS_COR: Record<string, string> = {
    BLOQUEADO: "bg-red-500/15 text-red-700 dark:text-red-300",
    PRONTO_PRA_DISPARAR: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    MATERIAL_PRONTO: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    AGUARDA_F21_F22: "bg-secondary/60 text-muted-foreground",
    CONCLUIDO: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <ModuloShell
      titulo="Cutover InChurch → Maranata App"
      descricao="Plano de saída do InChurch. Maranata App está paritário (~99%) — falta a parte operacional/humana."
      stats={[
        { label: "Membros", valor: totalMembros },
        { label: "Usuários App", valor: totalUsuariosApp },
        { label: "Eventos", valor: totalEventos },
        { label: "Lançamentos", valor: totalLancamentos },
      ]}
    >
      <section className="space-y-3">
        {itens.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-xs">
                    {item.id}
                  </span>
                  <h2 className="text-lg font-semibold">{item.titulo}</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.info}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs uppercase tracking-widest ${STATUS_COR[item.status]}`}
              >
                {item.status.replace(/_/g, " ")}
              </span>
            </header>
            <div className="mt-4 grid gap-2 text-sm">
              <div>
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Bloqueador
                </span>
                <p>{item.bloqueador}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Próxima ação
                </span>
                <p>{item.acao}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="font-semibold">Documentos de apoio</h2>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>
            <code className="rounded bg-muted/60 px-1">~/dev/maranata-app/docs/cutover-comunicacao-membros.md</code>{" "}
            — Templates push/WhatsApp/email/IG/banner
          </li>
          <li>
            <code className="rounded bg-muted/60 px-1">~/dev/maranata-app/docs/cutover-treinamento-admins.md</code>{" "}
            — Roteiro Zoom 60min
          </li>
          <li>
            <code className="rounded bg-muted/60 px-1">~/dev/maranata-app/PARIDADE-INCHURCH.md</code>{" "}
            — Playbook técnico completo
          </li>
          <li>
            <code className="rounded bg-muted/60 px-1">~/dev/maranata-app-paridade-backups/2026-05-20/</code>{" "}
            — Backup pré-cutover (rollback)
          </li>
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5">
        <h2 className="font-semibold">Disparar comunicação (depende Paulo aprovar)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Após Paulo decidir lote (ex: 200 por dia), usar{" "}
          <Link href="/admin/push" className="text-primary underline">
            /admin/push segmentado
          </Link>{" "}
          → escolher templates "cutover-anuncio" / "cutover-follow-up" → segmentar
          por igreja se quiser fazer faseado.
        </p>
        <p className="mt-2 text-sm">
          E-mail e WhatsApp seguem manual (templates copy/paste em{" "}
          <code>docs/cutover-comunicacao-membros.md</code>).
        </p>
      </section>
    </ModuloShell>
  );
}
