import { cacheLife, cacheTag } from "next/cache";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/publico";
import type { Congregacao, CongregacaoCulto } from "@/lib/tipos-banco";

/** Comum com a lista de cultos oficiais dela. */
export type ComumComCultos = Congregacao & { cultos: CongregacaoCulto[] };

/**
 * Banco fora do ar não pode derrubar o portal: a consulta registra o erro no
 * servidor e devolve lista vazia, e a tela mostra um aviso honesto.
 */
function aviso(onde: string, erro: unknown) {
  console.error(`[portal] falha ao ler ${onde}:`, erro);
}

/**
 * Ordem alfabética de verdade em português: `localeCompare` põe "Água" antes de
 * "Centro", o que a ordenação do banco não garante em toda instalação.
 */
export function ordenarPorNome<T extends { nome: string }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function listarCongregacoes(): Promise<ComumComCultos[]> {
  "use cache";
  cacheTag("congregacoes");
  cacheLife("hours");

  if (!supabaseConfigurado()) return [];

  const supabase = clientePublico();
  const [comuns, cultos] = await Promise.all([
    supabase.from("congregacoes").select("*"),
    supabase.from("congregacao_cultos").select("*"),
  ]);

  if (comuns.error || cultos.error) {
    aviso("congregacoes", comuns.error ?? cultos.error);
    return [];
  }

  return ordenarPorNome(
    (comuns.data ?? []).map((c) => ({
      ...c,
      cultos: (cultos.data ?? []).filter((k) => k.congregacao_id === c.id),
    })),
  );
}

export async function buscarCongregacao(slug: string): Promise<ComumComCultos | null> {
  "use cache";
  cacheTag("congregacoes");
  cacheLife("hours");

  if (!supabaseConfigurado()) return null;

  const supabase = clientePublico();
  const { data, error } = await supabase
    .from("congregacoes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    aviso(`congregacao ${slug}`, error);
    return null;
  }
  if (!data) return null;

  const { data: cultos } = await supabase
    .from("congregacao_cultos")
    .select("*")
    .eq("congregacao_id", data.id);

  return { ...data, cultos: cultos ?? [] };
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
