import { cacheLife, cacheTag } from "next/cache";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/publico";
import type { Cidade, Congregacao, CongregacaoCulto } from "@/lib/tipos-banco";

/** Comum com os cultos oficiais dela e a cidade onde fica. */
export type ComumComCultos = Congregacao & {
  cultos: CongregacaoCulto[];
  cidade: Cidade | null;
};

/** Comuns de uma cidade. `cidade` nulo agrupa as que ainda não têm cidade. */
export type GrupoDeCidade = { cidade: Cidade | null; comuns: ComumComCultos[] };

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
  const [comuns, cultos, cidades] = await Promise.all([
    supabase.from("congregacoes").select("*"),
    supabase.from("congregacao_cultos").select("*"),
    supabase.from("cidades").select("*"),
  ]);

  if (comuns.error || cultos.error) {
    aviso("congregacoes", comuns.error ?? cultos.error);
    return [];
  }
  if (cidades.error) aviso("cidades", cidades.error);

  const porId = new Map((cidades.data ?? []).map((c) => [c.id, c]));

  return ordenarPorNome(
    (comuns.data ?? []).map((c) => ({
      ...c,
      cultos: (cultos.data ?? []).filter((k) => k.congregacao_id === c.id),
      cidade: c.cidade_id ? (porId.get(c.cidade_id) ?? null) : null,
    })),
  );
}

/**
 * Agrupa as comuns por cidade, em ordem alfabética. As que ainda não têm cidade
 * ficam por último, num grupo sem título.
 *
 * Quando nenhuma comum tem cidade — instalação nova, antes de a secretaria
 * cadastrar — devolve um único grupo, e a tela mostra a grade lisa de sempre.
 */
export function agruparPorCidade(comuns: ComumComCultos[]): GrupoDeCidade[] {
  const grupos = new Map<string, GrupoDeCidade>();

  for (const comum of comuns) {
    const chave = comum.cidade?.id ?? "";
    const grupo = grupos.get(chave);
    if (grupo) grupo.comuns.push(comum);
    else grupos.set(chave, { cidade: comum.cidade, comuns: [comum] });
  }

  return [...grupos.values()].sort((a, b) => {
    if (!a.cidade) return 1;
    if (!b.cidade) return -1;
    return a.cidade.nome.localeCompare(b.cidade.nome, "pt-BR");
  });
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

  const [cultos, cidade] = await Promise.all([
    supabase.from("congregacao_cultos").select("*").eq("congregacao_id", data.id),
    data.cidade_id
      ? supabase.from("cidades").select("*").eq("id", data.cidade_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return { ...data, cultos: cultos.data ?? [], cidade: cidade.data ?? null };
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
