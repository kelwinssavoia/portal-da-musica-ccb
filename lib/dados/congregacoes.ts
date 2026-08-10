import { cacheLife, cacheTag } from "next/cache";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/publico";
import type { Congregacao } from "@/lib/tipos-banco";

/**
 * Banco fora do ar não pode derrubar o portal: a consulta registra o erro no
 * servidor e devolve lista vazia, e a tela mostra um aviso honesto.
 */
function aviso(onde: string, erro: unknown) {
  console.error(`[portal] falha ao ler ${onde}:`, erro);
}

export async function listarCongregacoes(): Promise<Congregacao[]> {
  "use cache";
  cacheTag("congregacoes");
  cacheLife("hours");

  if (!supabaseConfigurado()) return [];

  const { data, error } = await clientePublico()
    .from("congregacoes")
    .select("*")
    .order("ordem")
    .order("nome");

  if (error) {
    aviso("congregacoes", error);
    return [];
  }
  return data ?? [];
}

export async function buscarCongregacao(slug: string): Promise<Congregacao | null> {
  "use cache";
  cacheTag("congregacoes");
  cacheLife("hours");

  if (!supabaseConfigurado()) return null;

  const { data, error } = await clientePublico()
    .from("congregacoes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    aviso(`congregacao ${slug}`, error);
    return null;
  }
  return data;
}

/**
 * Link do GPS. Usa o endereço cadastrado quando não há `maps_url` próprio —
 * assim a secretaria não precisa colar link de mapa para cada comum.
 */
export function urlDoMapa(c: Pick<Congregacao, "nome" | "endereco" | "maps_url">): string {
  if (c.maps_url) return c.maps_url;
  const busca = encodeURIComponent(`${c.nome} — ${c.endereco}`);
  return `https://www.google.com/maps/search/?api=1&query=${busca}`;
}
