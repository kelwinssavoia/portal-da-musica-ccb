import "server-only";

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "@/lib/supabase/config";
import type { Database } from "@/lib/tipos-banco";

/**
 * Cliente com a chave secreta. **Ignora a RLS.**
 *
 * Existe para uma coisa só: convidar usuário em `/admin/usuarios`, que exige a
 * API de administração do Auth. Qualquer outra operação deve usar o cliente
 * normal e passar pela RLS.
 *
 * O `server-only` acima faz o build quebrar se este arquivo for importado, mesmo
 * que por engano, em código que vai para o navegador.
 */
export function clienteAdmin() {
  const chave = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !chave) {
    throw new Error(
      "SUPABASE_SECRET_KEY não configurada. Ela é necessária apenas para " +
        "convidar usuários. Nunca use o prefixo NEXT_PUBLIC_ nessa chave.",
    );
  }

  return createClient<Database>(SUPABASE_URL, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
