import { cacheLife, cacheTag } from "next/cache";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/publico";
import type { Arquivo, ArquivoCategoria, Duvida } from "@/lib/tipos-banco";

function aviso(onde: string, erro: unknown) {
  console.error(`[portal] falha ao ler ${onde}:`, erro);
}

export type CategoriaComArquivos = ArquivoCategoria & { arquivos: Arquivo[] };

/** Categorias na ordem definida, cada uma com seus arquivos ativos. */
export async function listarCategorias(): Promise<CategoriaComArquivos[]> {
  "use cache";
  cacheTag("arquivos");
  cacheLife("hours");

  if (!supabaseConfigurado()) return [];

  const supabase = clientePublico();

  const [categorias, arquivos] = await Promise.all([
    supabase.from("arquivo_categorias").select("*").order("ordem").order("nome"),
    supabase.from("arquivos").select("*").order("ordem").order("titulo"),
  ]);

  if (categorias.error || arquivos.error) {
    aviso("arquivos da secretaria", categorias.error ?? arquivos.error);
    return [];
  }

  return (categorias.data ?? []).map((cat) => ({
    ...cat,
    arquivos: (arquivos.data ?? []).filter((a) => a.categoria_id === cat.id),
  }));
}

export async function listarDuvidas(): Promise<Duvida[]> {
  "use cache";
  cacheTag("duvidas");
  cacheLife("hours");

  if (!supabaseConfigurado()) return [];

  const { data, error } = await clientePublico()
    .from("duvidas")
    .select("*")
    .order("ordem")
    .order("pergunta");

  if (error) {
    aviso("duvidas", error);
    return [];
  }
  return data ?? [];
}

/** Contagens usadas nos atalhos da tela de Início. */
export async function contarConteudo() {
  "use cache";
  cacheTag("congregacoes", "arquivos", "duvidas", "circulares");
  cacheLife("hours");

  if (!supabaseConfigurado()) {
    return { congregacoes: 0, arquivos: 0, duvidas: 0, circulares: 0 };
  }

  const supabase = clientePublico();
  const contar = async (tabela: "congregacoes" | "arquivos" | "duvidas" | "circulares") => {
    const { count, error } = await supabase
      .from(tabela)
      .select("*", { count: "exact", head: true });
    if (error) aviso(`contagem de ${tabela}`, error);
    return count ?? 0;
  };

  const [congregacoes, arquivos, duvidas, circulares] = await Promise.all([
    contar("congregacoes"),
    contar("arquivos"),
    contar("duvidas"),
    contar("circulares"),
  ]);

  return { congregacoes, arquivos, duvidas, circulares };
}
