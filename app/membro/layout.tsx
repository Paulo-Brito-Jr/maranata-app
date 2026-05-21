import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MembroBottomNav } from "@/components/membro-bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { MaranataLogo } from "@/components/maranata-logo";

export default async function MembroLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <MaranataLogo size={28} />
          <span className="font-semibold">Maranata</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-xs text-muted-foreground">{user.name.split(" ")[0]}</span>
        </div>
      </header>
      <main className="flex-1 overflow-auto px-5 py-6">{children}</main>
      <MembroBottomNav />
    </div>
  );
}
