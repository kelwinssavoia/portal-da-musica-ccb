import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/tipos-banco";

/**
 * O que sobrou do lado do servidor sobre arquivos: **apagar**.
 *
 * O envio acontece no navegador, direto para o Storage — ver
 * `components/admin/campo-upload.tsx`. Server Action tem limite de 1 MB de
 * corpo, e a Vercel corta requisição em 4,5 MB, então subir arquivo pelo
 * servidor nunca funcionaria para foto de celular nem para PDF de circular.
 */
export async function apagarArquivo(
  supabase: SupabaseClient<Database>,
  bucket: string,
  caminho: string | null,
): Promise<void> {
  if (!caminho) return;
  const { error } = await supabase.storage.from(bucket).remove([caminho]);
  if (error) console.error(`[cms] não foi possível apagar ${bucket}/${caminho}:`, error);
}
