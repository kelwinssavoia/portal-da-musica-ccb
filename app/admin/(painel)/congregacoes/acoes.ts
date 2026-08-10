"use server";

import { z } from "zod";

import {
  acao,
  horaOpcional,
  inteiro,
  marcado,
  numeroOpcional,
  paraSlug,
  textoObrigatorio,
  textoOpcional,
  type Resultado,
} from "@/lib/acoes";
import { LIMITE_FOTO, apagarArquivo, caminhoDe, subirArquivo, temArquivo } from "@/lib/upload";

/** Meses vêm como uma lista de checkboxes `mes_1`…`mes_12`. */
function mesesDoFormulario(dados: FormData): number[] | null {
  const marcados: number[] = [];
  for (let m = 1; m <= 12; m++) {
    if (dados.get(`mes_${m}`) === "sim") marcados.push(m);
  }
  // Nenhum ou todos = todo mês, que no banco é `null`.
  return marcados.length === 0 || marcados.length === 12 ? null : marcados;
}

const esquema = z.object({
  id: textoOpcional,
  nome: textoObrigatorio("Nome"),
  slug: textoOpcional,
  endereco: textoOpcional,
  maps_url: textoOpcional,
  culto_dow: numeroOpcional,
  culto_hora: horaOpcional,
  ensaio_ord: numeroOpcional,
  ensaio_dow: numeroOpcional,
  ensaio_hora: horaOpcional,
  observacoes: textoOpcional,
  ordem: inteiro,
  ativo: marcado,
});

export async function salvarCongregacao(_: unknown, dados: FormData): Promise<Resultado> {
  const meses = mesesDoFormulario(dados);
  const foto = dados.get("foto");

  return acao("congregacoes", esquema, dados, async (v, supabase) => {
    const slug = v.slug ? paraSlug(v.slug) : paraSlug(v.nome);
    if (slug === "") throw new Error("Não foi possível gerar o endereço da página pelo nome.");

    // Ensaio só existe com ordinal E dia da semana; um sem o outro não gera data.
    if ((v.ensaio_ord === null) !== (v.ensaio_dow === null)) {
      throw new Error(
        "Para o ensaio local, preencha o ordinal e o dia da semana juntos — ou deixe os dois em branco.",
      );
    }

    const registro = {
      nome: v.nome,
      slug,
      endereco: v.endereco ?? "",
      maps_url: v.maps_url,
      culto_dow: v.culto_dow,
      culto_hora: v.culto_hora,
      ensaio_ord: v.ensaio_ord,
      ensaio_dow: v.ensaio_dow,
      ensaio_hora: v.ensaio_hora,
      ensaio_meses: meses,
      observacoes: v.observacoes,
      ordem: v.ordem,
      ativo: v.ativo,
    };

    let id = v.id;

    if (id) {
      const { error } = await supabase.from("congregacoes").update(registro).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("congregacoes")
        .insert(registro)
        .select("id")
        .single();
      if (error) throw error;
      id = data.id;
    }

    if (temArquivo(foto)) {
      const caminho = caminhoDe("comuns", slug, foto);
      await subirArquivo(supabase, "congregacoes", caminho, foto, LIMITE_FOTO);

      const { error } = await supabase
        .from("congregacoes")
        .update({ foto_path: caminho })
        .eq("id", id);
      if (error) throw error;
    }
  });
}

const esquemaId = z.object({ id: textoObrigatorio("Registro") });

export async function excluirCongregacao(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("congregacoes", esquemaId, dados, async (v, supabase) => {
    const { data } = await supabase
      .from("congregacoes")
      .select("foto_path")
      .eq("id", v.id)
      .maybeSingle();

    const { error } = await supabase.from("congregacoes").delete().eq("id", v.id);
    if (error) throw error;

    await apagarArquivo(supabase, "congregacoes", data?.foto_path ?? null);
  });
}

export async function removerFoto(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("congregacoes", esquemaId, dados, async (v, supabase) => {
    const { data } = await supabase
      .from("congregacoes")
      .select("foto_path")
      .eq("id", v.id)
      .maybeSingle();

    const { error } = await supabase
      .from("congregacoes")
      .update({ foto_path: null })
      .eq("id", v.id);
    if (error) throw error;

    await apagarArquivo(supabase, "congregacoes", data?.foto_path ?? null);
  });
}
