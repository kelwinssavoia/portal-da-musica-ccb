import { cacheLife, cacheTag } from "next/cache";

import { siteUrl } from "@/lib/ajustes";
import { ordenarPorNome } from "@/lib/dados/congregacoes";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/publico";
import type { clienteServidor } from "@/lib/supabase/servidor";
import type { RodizioPublico } from "@/lib/tipos-banco";

type Cliente = Awaited<ReturnType<typeof clienteServidor>>;

/** Endereço que vai para o grupo das organistas. */
export function linkDoRodizio(token: string): string {
  return `${siteUrl()}/rodizio/${token}`;
}

/** Comuns com cultos e as organistas de todas elas, para o editor do CMS. */
export async function dadosDoEditor(supabase: Cliente) {
  const [comuns, cultos, organistas] = await Promise.all([
    supabase.from("congregacoes").select("id, nome"),
    supabase.from("congregacao_cultos").select("*"),
    supabase.from("organistas").select("*"),
  ]);

  return {
    comuns: ordenarPorNome(comuns.data ?? []).map((c) => ({
      ...c,
      cultos: (cultos.data ?? [])
        .filter((k) => k.congregacao_id === c.id)
        .map((k) => ({ dow: k.dow, hora: k.hora })),
    })),
    organistas: organistas.data ?? [],
  };
}

/** Rodízio com participantes e escala, como o CMS edita e imprime. */
export async function rodizioCompleto(supabase: Cliente, id: string) {
  const { data: rodizio } = await supabase.from("rodizios").select("*").eq("id", id).maybeSingle();
  if (!rodizio) return null;

  const [participantes, escala, comum] = await Promise.all([
    supabase.from("rodizio_organistas").select("*").eq("rodizio_id", id),
    supabase.from("rodizio_escala").select("*").eq("rodizio_id", id).order("data"),
    supabase.from("congregacoes").select("id, nome").eq("id", rodizio.congregacao_id).single(),
  ]);

  return {
    ...rodizio,
    comum: comum.data,
    participantes: participantes.data ?? [],
    escala: escala.data ?? [],
  };
}

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Rodízio aberto pelo link das organistas.
 *
 * As tabelas do rodízio não têm leitura pública; a função `rodizio_publico`
 * entrega só o rodízio daquele token. Token malformado nem chega no banco.
 */
export async function buscarRodizioPublico(token: string): Promise<RodizioPublico | null> {
  "use cache";
  cacheTag("rodizios");
  cacheLife("hours");

  if (!supabaseConfigurado() || !TOKEN.test(token)) return null;

  const { data, error } = await clientePublico().rpc("rodizio_publico", { p_token: token });
  if (error) {
    console.error("[portal] falha ao ler rodízio:", error);
    return null;
  }
  return data ?? null;
}
