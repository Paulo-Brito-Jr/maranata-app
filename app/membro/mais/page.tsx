import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, rolesPodemAdministrar } from "@/lib/auth";
import { PushToggle } from "@/components/push-toggle";
import {
  Heart,
  HandCoins,
  MessageCircleHeart,
  Users,
  User,
  IdCard,
  History,
  Shield,
  BookMarked,
  Sparkles,
  GraduationCap,
  BellRing,
} from "lucide-react";

export const metadata = { title: "Mais" };
export const dynamic = "force-dynamic";

type Item = {
  href: string;
  titulo: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  destacar?: boolean;
};

export default async function MembroMais() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/mais");

  const principais: Item[] = [
    { href: "/membro/perfil", titulo: "Perfil", desc: "Seus dados", icon: User },
    { href: "/membro/carteirinha", titulo: "Carteirinha", desc: "QR de identificação", icon: IdCard },
    { href: "/membro/historico", titulo: "Histórico", desc: "Eventos, doações, oração", icon: History },
    { href: "/membro/oracao", titulo: "Oração", desc: "Pedidos e respostas", icon: Heart },
    {
      href: "/membro/testemunhos",
      titulo: "Testemunhos",
      desc: "O que Deus tem feito",
      icon: MessageCircleHeart,
    },
    { href: "/membro/celula", titulo: "Minha célula", desc: "Encontros e relatos", icon: Users },
    { href: "/membro/doar", titulo: "Doar", desc: "Dízimo e ofertas", icon: HandCoins, destacar: true },
    { href: "/membro/jornadas", titulo: "Jornadas", desc: "Trilhas de discipulado", icon: Sparkles },
    {
      href: "/membro/devocional",
      titulo: "Devocional",
      desc: "Versículo + reflexão do dia",
      icon: BookMarked,
    },
    {
      href: "/membro/escola",
      titulo: "Escola Bíblica",
      desc: "EBD + IBM (notas, faltas)",
      icon: GraduationCap,
    },
  ];

  const ehAdmin = rolesPodemAdministrar(user.role);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Mais</h1>
        <p className="text-sm text-muted-foreground">
          Tudo que a Maranata oferece pra você, num só lugar.
        </p>
      </header>

      <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-4">
        <div className="flex items-start gap-3">
          <BellRing className="size-6 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Ative as notificações</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Receba lembrete de evento, devocional do dia e quando seu pedido de oração for respondido.
            </p>
            <div className="mt-3">
              <PushToggle />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {principais.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex flex-col rounded-2xl border p-4 transition ${
                item.destacar
                  ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary/40"
              }`}
            >
              <Icon className="size-6 text-primary" />
              <div className="mt-3 font-medium">{item.titulo}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{item.desc}</div>
            </Link>
          );
        })}
      </section>

      {ehAdmin && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Equipe
          </h2>
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-4 transition hover:bg-primary/15"
          >
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-primary" />
              <div>
                <div className="font-medium">Painel administrativo</div>
                <div className="text-xs text-muted-foreground">
                  Membros, células, eventos, financeiro…
                </div>
              </div>
            </div>
            <span className="text-primary">→</span>
          </Link>
        </section>
      )}
    </div>
  );
}
