import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue" />
            <span className="font-semibold">Maranata</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/eventos" className="hover:text-primary">
              Eventos
            </Link>
            <Link href="/testemunhos" className="hover:text-primary">
              Testemunhos
            </Link>
            <Link href="/doar" className="hover:text-primary">
              Doar
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:opacity-90"
            >
              Entrar
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} IGREJA MISSIONÁRIA EVANGÉLICA MARANATA · CNPJ 42.117.804/0001-15
      </footer>
    </div>
  );
}
