"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, BookOpen, Mic, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/membro", label: "Início", icon: Home, exact: true },
  { href: "/membro/eventos", label: "Eventos", icon: Calendar },
  { href: "/membro/biblia", label: "Bíblia", icon: BookOpen },
  { href: "/membro/pregacoes", label: "Pregações", icon: Mic },
  { href: "/membro/mais", label: "Mais", icon: MoreHorizontal },
];

export function MembroBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/80 backdrop-blur">
      {ITENS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-3 text-xs transition",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
