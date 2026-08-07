import { createClient } from "@supabase/supabase-js";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, SEM_CONFIG } from "@/lib/supabase/config";
import type { Database } from "@/lib/tipos-banco";

/**
 * Cliente de leitura do portal público.
 *
 * Sem cookies de propósito: as páginas públicas não têm sessão, e ler cookie
 * num Server Component tira a página do cache. Tudo o que este cliente enxerga
 * é o que a RLS libera para `anon` — ou seja, só conteúdo ativo/publicado.
 */
export function clientePublico() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error(SEM_CONFIG);

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
