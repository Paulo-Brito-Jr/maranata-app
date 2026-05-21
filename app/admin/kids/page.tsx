import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  Baby,
  ScanLine,
  LogOut,
  Users,
  AlertTriangle,
  Tag,
  Layers,
} from "lucide-react";

export const metadata = { title: "Kids" };
export const dynamic = "force-dynamic";

export default async function KidsHub() {
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  // Kids é um ministério — pastor geral de KIDS pode ver as 15 unidades.
  const ctx = await getIgrejaContexto({ ministerioPagina: "KIDS" });
  const filtroIgreja = filtroIgrejaWhere(ctx);

  const [
    totalCriancas,
    totalTurmas,
    ativosAgora,
    checkinsHoje,
    comAlergias,
    salasComAtivos,
  ] = await Promise.all([
    prisma.kidsCrianca.count({ where: { ativa: true, ...filtroIgreja } }),
    prisma.kidsTurma.count({ where: { ativa: true, ...filtroIgreja } }),
    prisma.kidsCheckin.count({
      where: { saidaEm: null, ...(filtroIgreja.igrejaId ? { turma: { igrejaId: filtroIgreja.igrejaId } } : {}) },
    }),
    prisma.kidsCheckin.count({
      where: { entradaEm: { gte: inicioHoje }, ...(filtroIgreja.igrejaId ? { turma: { igrejaId: filtroIgreja.igrejaId } } : {}) },
    }),
    prisma.kidsCrianca.count({
      where: { ativa: true, NOT: [{ alergias: null }, { alergias: "" }], ...filtroIgreja },
    }),
    prisma.kidsTurma.findMany({
      where: {
        ativa: true,
        checkins: { some: { saidaEm: null } },
        ...filtroIgreja,
      },
      include: {
        igreja: { select: { nome: true } },
        _count: { select: { checkins: { where: { saidaEm: null } } } },
      },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Kids"
      descricao="Check-in/out via QR, etiqueta com alergias visíveis, controle de retirada, sala ao vivo e emergência."
      stats={[
        { label: "Crianças ativas", valor: totalCriancas },
        { label: "Turmas", valor: totalTurmas },
        { label: "Ativos AGORA", valor: ativosAgora, ref: "em sala" },
        { label: "Check-ins hoje", valor: checkinsHoje },
        { label: "Com alergias", valor: comAlergias, ref: "atenção redobrada" },
      ]}
      acoes={[
        { href: "/admin/kids/checkin", label: "Iniciar check-in" },
        { href: "/admin/kids/checkout", label: "Retirar criança" },
      ]}
    >
      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <AtalhoCard
          href="/admin/kids/checkin"
          titulo="Check-in"
          desc="Receber criança e gerar ticket de retirada"
          icon={ScanLine}
          destacar
        />
        <AtalhoCard
          href="/admin/kids/checkout"
          titulo="Retirada"
          desc="Validar ticket QR e liberar"
          icon={LogOut}
        />
        <AtalhoCard
          href="/admin/kids/criancas"
          titulo="Crianças"
          desc={`Cadastro e ficha (${totalCriancas})`}
          icon={Baby}
        />
        <AtalhoCard
          href="/admin/kids/turmas"
          titulo="Turmas / Salas"
          desc={`Gerenciar salas (${totalTurmas})`}
          icon={Layers}
        />
        <AtalhoCard
          href="/admin/kids/historico"
          titulo="Histórico"
          desc="Buscar check-ins anteriores"
          icon={Users}
        />
      </section>

      {salasComAtivos.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Salas com crianças agora
          </h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {salasComAtivos.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/admin/kids/sala/${t.id}`}
                  className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 transition hover:bg-emerald-500/15"
                >
                  <div>
                    <p className="font-semibold">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.igreja.nome} · {t.faixaEtaria}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-emerald-950">
                      {t._count.checkins} em sala
                    </span>
                    <Tag className="size-4 text-emerald-300" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" />
          <div className="text-sm">
            <p className="font-medium text-amber-200">Protocolo de retirada</p>
            <p className="mt-1 text-amber-300/80">
              Nenhuma criança sai sem o ticket QR conferido. Em emergência, use o botão dentro da
              sala — ele dispara push pra todos os responsáveis e alerta a diretoria.
            </p>
          </div>
        </div>
      </section>
    </ModuloShell>
  );
}

function AtalhoCard({
  href,
  titulo,
  desc,
  icon: Icon,
  destacar,
}: {
  href: string;
  titulo: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  destacar?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
        destacar
          ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40"
      }`}
    >
      <Icon className="size-6 text-primary" />
      <div>
        <p className="font-medium">{titulo}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}
