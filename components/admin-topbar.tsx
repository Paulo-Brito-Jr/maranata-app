import { ThemeToggle } from "./theme-toggle";
import type { MKUser } from "@/lib/maranata-key-sso";
import { RoleBadge } from "./role-badge";
import { ImpersonarStarter } from "./impersonar-controls";
import { IgrejaSeletor } from "./igreja-seletor";
import type { IgrejaContexto } from "@/lib/igreja-contexto";

export function AdminTopbar({
  user,
  realRole,
  igrejaCtx,
}: {
  user: MKUser | null;
  realRole?: MKUser["role"];
  igrejaCtx?: IgrejaContexto;
}) {
  const ehSuperReal = realRole === "SUPER_ADMIN";
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/60 px-6 backdrop-blur">
      <div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Painel administrativo · IME Maranata
        </span>
      </div>
      <div className="flex items-center gap-3">
        {igrejaCtx && <IgrejaSeletor ctx={igrejaCtx} />}
        <RoleBadge role={user?.role} />
        {ehSuperReal && <ImpersonarStarter />}
        <ThemeToggle />
        <div className="hidden md:flex flex-col items-end leading-tight">
          <span className="text-sm font-medium">{user?.name ?? "—"}</span>
          <span className="text-xs text-muted-foreground">{user?.email ?? ""}</span>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary">
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
