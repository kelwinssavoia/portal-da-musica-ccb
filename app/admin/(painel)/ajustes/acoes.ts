"use server";

import { z } from "zod";

import { acao, type Resultado } from "@/lib/acoes";
import { CAMPOS_AJUSTES } from "@/lib/ajustes-campos";


/**
 * Todos os ajustes de uma vez.
 *
 * `indexavel` fica de fora daqui e tem ação própria, porque é a única opção com
 * consequência de divulgação: liga e desliga o portal no Google.
 */
export async function salvarAjustes(_: unknown, dados: FormData): Promise<Resultado> {
  const esquema = z.object(
    Object.fromEntries(CAMPOS_AJUSTES.map(({ chave }) => [chave, z.string().optional()])),
  );

  return acao("ajustes", esquema, dados, async (v, supabase) => {
    const linhas = CAMPOS_AJUSTES.map(({ chave }) => ({
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
