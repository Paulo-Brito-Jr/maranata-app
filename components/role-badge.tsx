import type { MKRole } from "@/lib/maranata-key-sso";
import { ROTULO_PAPEL } from "@/lib/auth";
import { cn } from "@/lib/utils";

const CLASSES: Record<MKRole, string> = {
  SUPER_ADMIN: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  PASTOR_DIRETORIA: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  ADMIN_IGREJA: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  LIDER_CELULA: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  SECRETARIA: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
  FINANCEIRO: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  KIDS_RESPONSAVEL: "bg-pink-500/15 text-pink-300 ring-pink-500/30",
  MEMBRO: "bg-blue-500/15 text-blue-300 ring-blue-500/30",
};

export function RoleBadge({
  role,
  className,
  size = "sm",
}: {
  role: MKRole | undefined;
  className?: string;
  size?: "xs" | "sm" | "md";
}) {
  if (!role) return null;
  const sizes = {
    xs: "text-[10px] px-2 py-0.5",
    sm: "text-xs px-2.5 py-0.5",
    md: "text-sm px-3 py-1",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset",
        sizes[size],
        CLASSES[role],
        className,
      )}
      title={`Papel ativo: ${ROTULO_PAPEL[role]}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {ROTULO_PAPEL[role]}
    </span>
  );
}
