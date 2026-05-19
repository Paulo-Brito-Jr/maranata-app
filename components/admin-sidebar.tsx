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
} from "lucide-react";

const ITENS = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { href: "/admin/membros", label: "Membros", icon: Users },
  { href: "/admin/celulas", label: "Células", icon: Heart },
  { href: "/admin/eventos", label: "Eventos", icon: Calendar },
  { href: "/admin/pregacoes", label: "Pregações", icon: Mic },
  { href: "/admin/devocional", label: "Devocional", icon: BookMarked },
  { href: "/admin/escola", label: "Escola Bíblica", icon: GraduationCap },
  { href: "/admin/financeiro", label: "Financeiro", icon: HandCoins },
  { href: "/admin/intercessao", label: "Intercessão", icon: Sparkles },
  { href: "/admin/testemunhos", label: "Testemunhos", icon: MessageCircleHeart },
  { href: "/admin/kids", label: "Kids", icon: Baby },
  { href: "/admin/jornadas", label: "Jornadas", icon: Map },
  { href: "/admin/loja", label: "Loja", icon: ShoppingBag },
  { href: "/admin/push", label: "Comunicação", icon: Bell },
  { href: "/admin/config", label: "Configurações", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 backdrop-blur md:block">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="size-7 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue" />
        <span className="font-semibold">Maranata App</span>
      </div>
      <nav className="flex flex-col gap-1 p-3 text-sm">
        {ITENS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition",
                active
                  ? "bg-primary/15 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
