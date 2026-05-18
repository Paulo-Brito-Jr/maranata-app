import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminTopbar } from "@/components/admin-topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/admin");

  const podeAcessar =
    user.role === "SUPER_ADMIN" ||
    user.role === "PASTOR_DIRETORIA" ||
    user.role === "ADMIN_IGREJA";
  if (!podeAcessar) redirect("/unauthorized");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminTopbar user={user} />
        <main className="flex-1 overflow-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
