import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "./lib/auth";
import { verifyMaranataKeyToken, type MKRole } from "./lib/maranata-key-sso";

type Regra = { padrao: RegExp; papeis: MKRole[] };

const ROTAS: Regra[] = [
  { padrao: /^\/admin(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"] },
  { padrao: /^\/financeiro(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "FINANCEIRO"] },
  { padrao: /^\/secretaria(\/|$)/, papeis: ["SUPER_ADMIN", "ADMIN_IGREJA", "SECRETARIA"] },
  { padrao: /^\/celulas\/manage(\/|$)/, papeis: ["SUPER_ADMIN", "ADMIN_IGREJA", "LIDER_CELULA"] },
  { padrao: /^\/kids\/manage(\/|$)/, papeis: ["SUPER_ADMIN", "ADMIN_IGREJA", "KIDS_RESPONSAVEL"] },
  { padrao: /^\/membro(\/|$)/, papeis: ["MEMBRO", "SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "LIDER_CELULA", "SECRETARIA", "FINANCEIRO", "KIDS_RESPONSAVEL"] },
  { padrao: /^\/api\/admin(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"] },
  { padrao: /^\/api\/financeiro(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "FINANCEIRO"] },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const regra = ROTAS.find((r) => r.padrao.test(pathname));
  if (!regra) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyMaranataKeyToken(token) : null;

  const autorizado =
    user?.role === "SUPER_ADMIN" || (user?.role && regra.papeis.includes(user.role));

  if (!autorizado) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { erro: user ? "Sem permissão" : "Não autenticado" },
        { status: user ? 403 : 401 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redir", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/financeiro/:path*",
    "/secretaria/:path*",
    "/celulas/manage/:path*",
    "/kids/manage/:path*",
    "/membro/:path*",
    "/api/admin/:path*",
    "/api/financeiro/:path*",
  ],
};
