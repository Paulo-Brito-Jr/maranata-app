"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Heart,
  Calendar,
  Mic,
  HandCoins,
  Sparkles,
  MessageCircleHeart,
  Baby,
  Map,
  ShoppingBag,
  Bell,
  Settings,
  BookMarked,
  GraduationCap,
  ClipboardList,
  Languages,
  MessageSquare,
  FileText,
  ListChecks,
  ImageIcon,
  ShieldCheck,
  HandHeart,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };
type Grupo = { titulo: string; itens: Item[] };

const PAINEL: Item = { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true };

const GRUPOS: Grupo[] = [
  {
    titulo: "Pessoas",
    itens: [
      { href: "/admin/membros", label: "Membros", icon: Users },
      { href: "/admin/atendimentos", label: "Atendimentos", icon: ClipboardList },
    ],
  },
  {
    titulo: "Comunidade",
    itens: [
      { href: "/admin/celulas", label: "Células", icon: Heart },
      { href: "/admin/intercessao", label: "Intercessão", icon: Sparkles },
      { href: "/admin/testemunhos", label: "Testemunhos", icon: MessageCircleHeart },
      { href: "/admin/jornadas", label: "Jornadas", icon: Map },
    ],
  },
  {
    titulo: "Eventos & Mídia",
    itens: [
      { href: "/admin/eventos", label: "Eventos", icon: Calendar },
      { href: "/admin/pregacoes", label: "Pregações", icon: Mic },
      { href: "/admin/devocional", label: "Devocional", icon: BookMarked },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
    ],
  },
  {
    titulo: "Escola Bíblica",
    itens: [
      { href: "/admin/escola", label: "EBD & IBM", icon: GraduationCap },
    ],
  },
  {
    titulo: "Kids",
    itens: [
      { href: "/admin/kids", label: "Kids", icon: Baby },
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      { href: "/admin/financeiro", label: "Financeiro", icon: HandCoins },
      { href: "/admin/doadores", label: "Doadores", icon: HandHeart },
    ],
  },
  {
    titulo: "Loja",
    itens: [
      { href: "/admin/loja", label: "Loja Maranata", icon: ShoppingBag },
    ],
  },
  {
    titulo: "Comunicação",
    itens: [
      { href: "/admin/push", label: "Push", icon: Bell },
      { href: "/admin/mensagens", label: "Mensagens", icon: MessageSquare },
      { href: "/admin/paginas", label: "Páginas multiuso", icon: FileText },
    ],
  },
  {
    titulo: "Configuração",
    itens: [
      { href: "/admin/nomenclatura", label: "Nomenclatura", icon: Languages },
      { href: "/admin/campos-customizados", label: "Campos custom", icon: ListChecks },
      { href: "/admin/audit", label: "Auditoria", icon: ShieldCheck },
      { href: "/admin/config", label: "Configurações", icon: Settings },
    ],
  },
];

function isActive(pathname: string, item: Item): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function ItemLink({ item, pathname }: { item: Item; pathname: string }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
        active
          ? "bg-primary/15 font-medium text-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 backdrop-blur md:block">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="size-7 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue" />
        <span className="font-semibold">Maranata App</span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {/* Painel sempre fora de grupo, no topo */}
        <ItemLink item={PAINEL} pathname={pathname} />

        {GRUPOS.map((g) => {
          const algumAtivo = g.itens.some((i) => isActive(pathname, i));
          return (
            <details
              key={g.titulo}
              open={algumAtivo}
              className="group mt-2 first:mt-3"
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 hover:text-foreground"
              >
                <span>{g.titulo}</span>
                <ChevronRight
                  className="size-3.5 transition-transform group-open:rotate-90"
                  aria-hidden
                />
              </summary>
              <div className="mt-1 flex flex-col gap-0.5">
                {g.itens.map((it) => (
                  <ItemLink key={it.href} item={it} pathname={pathname} />
                ))}
              </div>
            </details>
          );
        })}
      </nav>
    </aside>
  );
}
