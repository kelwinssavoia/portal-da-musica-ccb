"use server";

import { z } from "zod";

import {
  acao,
  dataObrigatoria,
  marcado,
  textoObrigatorio,
  textoOpcional,
  type Resultado,
} from "@/lib/acoes";
import { apagarArquivo } from "@/lib/upload";
import { caminhoValido } from "@/lib/slug";

const esquema = z.object({
  id: textoOpcional,
  numero: textoObrigatorio("Número"),
  titulo: textoObrigatorio("Título"),
  resumo: textoOpcional,
  data: dataObrigatoria,
  url: textoOpcional,
  publicado: marcado,
  arquivo_path: textoOpcional,
  arquivo_nome: textoOpcional,
  arquivo_novo: textoOpcional,
});

export async function salvarCircular(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("circulares", esquema, dados, async (v, supabase) => {
    const enviouArquivo = v.arquivo_novo === "sim" && Boolean(v.arquivo_path);
    if (enviouArquivo && !caminhoValido(v.arquivo_path!)) {
      throw new Error("Caminho de arquivo inválido.");
    }

    // Uma circular precisa de PDF ou de link — sem um dos dois não há o que abrir.
    if (!v.id && !enviouArquivo && !v.url) {
      throw new Error("Envie o PDF da circular ou informe um link para ela.");
    }

    const base = {
      numero: v.numero,
      titulo: v.titulo,
      resumo: v.resumo,
      data: v.data,
      publicado: v.publicado,
    };

    let id = v.id;
    let anterior: string | null = null;

    if (id) {
      const { data } = await supabase
        .from("circulares")
        .select("arquivo_path")
        .eq("id", id)
        .maybeSingle();
      anterior = data?.arquivo_path ?? null;
    }

    const caminho = enviouArquivo ? v.arquivo_path! : null;

    const registro = enviouArquivo
      ? { ...base, origem: "upload" as const, arquivo_path: caminho, arquivo_nome: v.arquivo_nome, url: null }
      : v.url
        ? { ...base, origem: "link" as const, url: v.url, arquivo_path: null, arquivo_nome: null }
        : base;

    if (id) {
      const { error } = await supabase.from("circulares").update(registro).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("circulares").insert(registro).select("id").single();
      if (error) throw error;
      id = data.id;
    }

    // Trocou de PDF para outro caminho, ou virou link: o antigo não serve mais.
    if (anterior && anterior !== caminho) {
      await apagarArquivo(supabase, "circulares", anterior);
    }
  });
}

export async function excluirCircular(_: unknown, dados: FormData): Promise<Resultado> {
  return acao(
    "circulares",
    z.object({ id: textoObrigatorio("Registro") }),
    dados,
    async (v, supabase) => {
      const { data } = await supabase
        .from("circulares")
        .select("arquivo_path")
        .eq("id", v.id)
        .maybeSingle();

      const { error } = await supabase.from("circulares").delete().eq("id", v.id);
      if (error) throw error;

      await apagarArquivo(supabase, "circulares", data?.arquivo_path ?? null);
    },
  );
}
