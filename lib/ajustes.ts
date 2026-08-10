import { cacheLife, cacheTag } from "next/cache";

import { clientePublico } from "@/lib/supabase/publico";
import { supabaseConfigurado } from "@/lib/supabase/config";

/**
 * Ajustes do portal (textos institucionais e opções gerais).
 *
 * Vêm da tabela `ajustes`. Sem Supabase configurado — ou se a consulta falhar —
 * caem nos padrões abaixo, para que o portal nunca fique em branco.
 */

export type Ajustes = {
  instituicao: string;
  regiao: string;
  titulo: string;
  subtitulo: string;
  localidade: string;
  /** Vazio = não aparece no rodapé. */
  contato: string;
  heroTexto: string;
  rodapeNota: string;
  /** O portal pode aparecer em buscadores. Ver docs/ARQUITETURA.md §8.1. */
  indexavel: boolean;
};

const PADRAO: Ajustes = {
  instituicao: "Congregação Cristã no Brasil · Música",
  regiao: "Sua Região",
  titulo: "Portal da Música",
  subtitulo: "Secretaria da Música",
  localidade: "Sua Região — Cidade/UF",
  contato: "",
  heroTexto:
    "Um lugar só para as informações da música da regional: congregações, " +
    "ensaios, calendário, circulares e os arquivos da secretaria.",
  rodapeNota:
    "Projeto open-source, mantido por voluntário. Não é um canal oficial da " +
    "Congregação Cristã no Brasil.",
  indexavel: true,
};

/** Nome da coluna `chave` no banco → campo do objeto de ajustes. */
const CAMPOS: Record<string, keyof Ajustes> = {
  instituicao: "instituicao",
  regiao: "regiao",
  titulo: "titulo",
  subtitulo: "subtitulo",
  localidade: "localidade",
  contato: "contato",
  hero_texto: "heroTexto",
  rodape_nota: "rodapeNota",
  indexavel: "indexavel",
};

export async function getAjustes(): Promise<Ajustes> {
  "use cache";
  cacheTag("ajustes");
  cacheLife("hours");

  if (!supabaseConfigurado()) return PADRAO;

  try {
    const { data, error } = await clientePublico().from("ajustes").select("chave, valor");
    if (error || !data) return PADRAO;

    const ajustes = { ...PADRAO };

    for (const { chave, valor } of data) {
      const campo = CAMPOS[chave];
      if (!campo) continue;

      if (campo === "indexavel") {
        ajustes.indexavel = valor.trim().toLowerCase() !== "nao";
      } else if (valor.trim() !== "" || campo === "contato") {
        ajustes[campo] = valor;
      }
    }

    return ajustes;
  } catch {
    // Banco fora do ar não pode derrubar o portal inteiro.
    return PADRAO;
  }
}

/** URL pública do portal. Usada em metadata, sitemap e link mágico. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
