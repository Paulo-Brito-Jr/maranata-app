"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import type { IgrejaContexto } from "@/lib/igreja-contexto";

export function IgrejaSeletor({ ctx }: { ctx: IgrejaContexto }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (ctx.tipo === "sem-acesso") return null;

  if (ctx.tipo === "unica") {
    return (
      <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        <Building2 className="size-3.5" />
        <span>{ctx.igreja.apelido ?? ctx.igreja.nome}</span>
      </div>
    );
  }

  const igrejas = ctx.igrejas;
  const atualLabel =
    ctx.tipo === "selecionada"
      ? ctx.igreja.apelido ?? ctx.igreja.nome
      : "Todas as unidades";

  async function escolher(igrejaId: string | null) {
    setOpen(false);
    await fetch("/api/igreja-contexto", {
      method: "POST",
      body: JSON.stringify({ igrejaId }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        <Building2 className="size-3.5" />
        <span>{atualLabel}</span>
        <ChevronDown className="size-3" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          <button
            onClick={() => escolher(null)}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-muted ${
              ctx.tipo === "todas" ? "font-medium text-primary" : ""
            }`}
          >
            Todas as unidades
          </button>
          <div className="border-t border-border" />
          {igrejas.map((ig) => (
            <button
              key={ig.id}
              onClick={() => escolher(ig.id)}
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-muted ${
                ctx.tipo === "selecionada" && ctx.igreja.id === ig.id
                  ? "font-medium text-primary"
                  : ""
              }`}
            >
              <span>{ig.apelido ?? ig.nome}</span>
              {ig.ehSede && (
                <span className="text-[10px] uppercase text-muted-foreground">
                  sede
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
