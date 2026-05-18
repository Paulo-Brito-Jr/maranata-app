import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { verifyMaranataKeyToken } from "@/lib/maranata-key-sso";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const next = url.searchParams.get("next") ?? "/";

  if (!token) {
    return NextResponse.redirect(new URL("/login?err=missing_token", url.origin));
  }

  const user = await verifyMaranataKeyToken(token);
  if (!user) {
    return NextResponse.redirect(new URL("/login?err=invalid_token", url.origin));
  }

  const dest = next.startsWith("/") ? next : "/";
  const res = NextResponse.redirect(new URL(dest, url.origin));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
