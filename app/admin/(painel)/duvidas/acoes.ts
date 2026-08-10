"use server";

import { z } from "zod";

import { acao, inteiro, marcado, textoObrigatorio, textoOpcional, type Resultado } from "@/lib/acoes";

const esquema = z.object({
  id: textoOpcional,
  pergunta: textoObrigatorio("Pergunta"),
  resposta: textoObrigatorio("Resposta"),
  ordem: inteiro,
  ativo: marcado,
});

export async function salvarDuvida(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("duvidas", esquema, dados, async (v, supabase) => {
    const registro = {
      pergunta: v.pergunta,
      resposta: v.resposta,
      ordem: v.ordem,
      ativo: v.ativo,
    };

    const { error } = v.id
      ? await supabase.from("duvidas").update(registro).eq("id", v.id)
      : await supabase.from("duvidas").insert(registro);

    if (error) throw error;
  });
}

export async function excluirDuvida(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("duvidas", z.object({ id: textoObrigatorio("Registro") }), dados, async (v, supabase) => {
    const { error } = await supabase.from("duvidas").delete().eq("id", v.id);
    if (error) throw error;
  });
}
