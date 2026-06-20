// Browser Supabase client (cookie-backed session so the proxy can read it).
// Drop-in replacement for the original `@/integrations/supabase/client` import:
// admin pages and lib/storage.ts import { supabase } from here.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in .env.local (or the Vercel dashboard).",
  );
}

export const supabase = createBrowserClient<Database>(url, anonKey);
