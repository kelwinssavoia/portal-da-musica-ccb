"use server";

import { z } from "zod";

import { acao, type Resultado } from "@/lib/acoes";

/** Chaves editáveis pelo CMS, na ordem em que aparecem na tela. */
export const CHAVES: { chave: string; rotulo: string; ajuda?: string; longo?: boolean }[] = [
  { chave: "instituicao", rotulo: "Faixa institucional", ajuda: "Texto da barra escura do topo." },
  { chave: "regiao", rotulo: "Região" },
  { chave: "titulo", rotulo: "Título do portal" },
  { chave: "subtitulo", rotulo: "Subtítulo" },
  { chave: "localidade", rotulo: "Localidade (rodapé)" },
  {
    chave: "contato",
    rotulo: "Contato (rodapé)",
    ajuda: "Deixe vazio para não aparecer. Nunca use dado pessoal de irmão.",
  },
  { chave: "hero_texto", rotulo: "Apresentação da tela inicial", longo: true },
  { chave: "rodape_nota", rotulo: "Nota do rodapé", longo: true },
];

/**
 * Todos os ajustes de uma vez.
 *
 * `indexavel` fica de fora daqui e tem ação própria, porque é a única opção com
 * consequência de divulgação: liga e desliga o portal no Google.
 */
export async function salvarAjustes(_: unknown, dados: FormData): Promise<Resultado> {
  const esquema = z.object(
    Object.fromEntries(CHAVES.map(({ chave }) => [chave, z.string().optional()])),
  );

  return acao("ajustes", esquema, dados, async (v, supabase) => {
    const linhas = CHAVES.map(({ chave }) => ({
      chave,
      valor: String((v as Record<string, string | undefined>)[chave] ?? "").trim(),
    }));

    const { error } = await supabase.from("ajustes").upsert(linhas, { onConflict: "chave" });
    if (error) throw error;
  });
}

export async function salvarIndexavel(_: unknown, dados: FormData): Promise<Resultado> {
  const esquema = z.object({ indexavel: z.string().optional() });

  return acao("ajustes", esquema, dados, async (v, supabase) => {
    const valor = v.indexavel === "sim" ? "sim" : "nao";

    const { error } = await supabase
      .from("ajustes")
      .upsert([{ chave: "indexavel", valor }], { onConflict: "chave" });
    if (error) throw error;

    return valor === "sim"
      ? "Salvo. O portal pode aparecer em buscadores."
      : "Salvo. O portal pediu aos buscadores para não listá-lo. Atenção: isso não protege nada — quem tem o link continua abrindo.";
  });
}
