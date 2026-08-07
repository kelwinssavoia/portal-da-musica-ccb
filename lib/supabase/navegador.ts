import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, SEM_CONFIG } from "@/lib/supabase/config";
import type { Database } from "@/lib/tipos-banco";

/**
 * Cliente do navegador. Usado só no CMS — para o login por link mágico e para
 * o upload de arquivo direto no Storage, que não passa pelo servidor.
 */
export function clienteNavegador() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error(SEM_CONFIG);

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
