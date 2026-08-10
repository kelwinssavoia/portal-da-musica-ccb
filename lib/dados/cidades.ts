import { cacheLife, cacheTag } from "next/cache";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/publico";
import type { Cidade } from "@/lib/tipos-banco";

export async function listarCidades(): Promise<Cidade[]> {
  "use cache";
  cacheTag("congregacoes");
  cacheLife("hours");

  if (!supabaseConfigurado()) return [];

  const { data, error } = await clientePublico().from("cidades").select("*");

  if (error) {
    console.error("[portal] falha ao ler cidades:", error);
    return [];
  }

  return (data ?? []).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
