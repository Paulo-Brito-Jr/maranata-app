import { NextRequest, NextResponse } from "next/server";
import { IMPERSONA_COOKIE, SESSION_COOKIE } from "./lib/auth";
import { verifyMaranataKeyToken, type MKRole } from "./lib/maranata-key-sso";

type Regra = { padrao: RegExp; papeis: MKRole[] };

const ROTAS: Regra[] = [
  { padrao: /^\/admin\/financeiro(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "FINANCEIRO"] },
  { padrao: /^\/admin\/kids(\/|$)/, papeis: ["SUPER_ADMIN", "ADMIN_IGREJA", "KIDS_RESPONSAVEL", "SECRETARIA"] },
  { padrao: /^\/admin\/membros(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA"] },
  { padrao: /^\/admin\/celulas(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "LIDER_CELULA"] },
  { padrao: /^\/admin\/intercessao(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA", "SECRETARIA"] },
  { padrao: /^\/admin(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"] },
  { padrao: /^\/api\/admin(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "ADMIN_IGREJA"] },
  { padrao: /^\/api\/financeiro(\/|$)/, papeis: ["SUPER_ADMIN", "PASTOR_DIRETORIA", "FINANCEIRO"] },
  { padrao: /^\/api\/kids(\/|$)/, papeis: ["SUPER_ADMIN", "ADMIN_IGREJA", "KIDS_RESPONSAVEL", "SECRETARIA"] },
  {
    padrao: /^\/membro(\/|$)/,
    papeis: [
      "MEMBRO",
      "SUPER_ADMIN",
      "PASTOR_DIRETORIA",
      "ADMIN_IGREJA",
      "LIDER_CELULA",
      "SECRETARIA",
      "FINANCEIRO",
      "KIDS_RESPONSAVEL",
    ],
  },
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const regra = ROTAS.find((r) => r.padrao.test(pathname));
  if (!regra) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const realUser = token ? await verifyMaranataKeyToken(token) : null;

  if (!realUser) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redir", pathname);
    return NextResponse.redirect(url);
  }

  let papelEfetivo: MKRole | undefined = realUser.role;
  if (realUser.role === "SUPER_ADMIN") {
    const imp = req.cookies.get(IMPERSONA_COOKIE)?.value as MKRole | undefined;
    if (imp && imp !== "SUPER_ADMIN") papelEfetivo = imp;
  }

  const autorizado = !!papelEfetivo && regra.papeis.includes(papelEfetivo);

  if (!autorizado) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/unauthorized";
    url.searchParams.set("from", pathname);
    if (papelEfetivo) url.searchParams.set("papel", papelEfetivo);
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
    "/api/kids/:path*",
  ],
};
