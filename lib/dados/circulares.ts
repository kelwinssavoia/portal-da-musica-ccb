import { cacheLife, cacheTag } from "next/cache";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/publico";
import type { Circular } from "@/lib/tipos-banco";

/** Circulares da mais recente para a mais antiga. */
export async function listarCirculares(): Promise<Circular[]> {
  "use cache";
  cacheTag("circulares");
  cacheLife("hours");

  if (!supabaseConfigurado()) return [];

  const { data, error } = await clientePublico()
    .from("circulares")
    .select("*")
    .order("data", { ascending: false });

  if (error) {
    console.error("[portal] falha ao ler circulares:", error);
    return [];
  }
  return data ?? [];
}
