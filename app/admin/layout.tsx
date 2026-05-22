import { redirect } from "next/navigation";
import { getCurrentUser, getRealUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminTopbar } from "@/components/admin-topbar";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { getIgrejaContexto } from "@/lib/igreja-contexto";
import { hasAppAccess } from "@/lib/integrations/maranata-suite";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, realUser] = await Promise.all([getCurrentUser(), getRealUser()]);
  if (!user) redirect("/login?redir=/admin");

  // Acesso ao admin: via papel local (JWT do Maranata Key) OU via grupos
  // do Suite que dão acesso ADMIN ao app "maranata-app". Se MARANATA_INTEGRATION_KEY
  // não estiver setada, hasAppAccess retorna false silenciosamente e cai
  // no comportamento antigo.
  const papelPermite =
    user.role === "SUPER_ADMIN" ||
    user.role === "PASTOR_DIRETORIA" ||
    user.role === "ADMIN_IGREJA";

  const viaGrupo = user.email
    ? await hasAppAccess(user.email, "maranata-app", "ADMIN")
    : false;

  if (!papelPermite && !viaGrupo) redirect("/unauthorized?from=/admin");

  const impersonando = user.impersonando;
  // No topbar inclui a Sede como opção de filtro (admin pode focar na Sede
  // pra ver eventos gerais, lançamentos centralizados, etc.).
  const igrejaCtx = await getIgrejaContexto({ incluirSede: true });

  return (
    <div className="flex min-h-screen flex-col">
      {impersonando && <ImpersonationBanner papel={impersonando} />}
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminTopbar user={user} realRole={realUser?.role} igrejaCtx={igrejaCtx} />
          <main className="flex-1 overflow-auto px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
