import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { publicEnv } from "@/lib/env";

// Cliente Supabase para Server Components / Server Actions / Route Handlers.
// Next.js 16: `cookies()` é assíncrono e precisa de `await`.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Em Server Components a escrita de cookies lança — o refresh de sessão
          // acontece no proxy. Aqui apenas ignoramos com segurança.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // no-op fora de Server Action/Route Handler
          }
        },
      },
    },
  );
}
