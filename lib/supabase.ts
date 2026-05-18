import {
  createBrowserClient,
  createServerClient,
  type CookieMethodsServer,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
}

export async function supabaseServer() {
  const store = await cookies();
  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return store.getAll();
    },
    setAll(arr) {
      try {
        for (const { name, value, options } of arr) {
          store.set(name, value, options as CookieOptions);
        }
      } catch {
        /* RSC read-only */
      }
    },
  };
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, { cookies: cookieMethods });
}

export function supabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
