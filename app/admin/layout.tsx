import { redirect } from "next/navigation";
import { getCurrentUser, getRealUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminTopbar } from "@/components/admin-topbar";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, realUser] = await Promise.all([getCurrentUser(), getRealUser()]);
  if (!user) redirect("/login?redir=/admin");

  const podeAcessar =
    user.role === "SUPER_ADMIN" ||
    user.role === "PASTOR_DIRETORIA" ||
    user.role === "ADMIN_IGREJA";
  if (!podeAcessar) redirect("/unauthorized?from=/admin");

  const impersonando = user.impersonando;

  return (
    <div className="flex min-h-screen flex-col">
      {impersonando && <ImpersonationBanner papel={impersonando} />}
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminTopbar user={user} realRole={realUser?.role} />
          <main className="flex-1 overflow-auto px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
