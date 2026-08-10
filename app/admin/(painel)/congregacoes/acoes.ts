"use server";

import { z } from "zod";

import {
  acao,
  horaOpcional,
  marcado,
  numeroOpcional,
  paraSlug,
  textoObrigatorio,
  textoOpcional,
  type Resultado,
} from "@/lib/acoes";
import { LIMITE_FOTO, apagarArquivo, caminhoDe, subirArquivo, temArquivo } from "@/lib/upload";

/**
 * Cultos vêm como um par de campos por dia da semana: `culto_dia_0` (checkbox) e
 * `culto_hora_0` (hora). Só entram os dias marcados.
 */
function cultosDoFormulario(dados: FormData): { dow: number; hora: string | null }[] {
  const cultos: { dow: number; hora: string | null }[] = [];

  for (let dow = 0; dow <= 6; dow++) {
    if (dados.get(`culto_dia_${dow}`) !== "sim") continue;
    const bruto = String(dados.get(`culto_hora_${dow}`) ?? "").trim();
    cultos.push({ dow, hora: bruto === "" ? null : bruto.length === 5 ? `${bruto}:00` : bruto });
  }
  return cultos;
}

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
  cidade_id: textoOpcional,
  endereco: textoOpcional,
  maps_url: textoOpcional,
  ensaio_ord: numeroOpcional,
  ensaio_dow: numeroOpcional,
  ensaio_hora: horaOpcional,
  observacoes: textoOpcional,
  ativo: marcado,
});

export async function salvarCongregacao(_: unknown, dados: FormData): Promise<Resultado> {
  const meses = mesesDoFormulario(dados);
  const cultos = cultosDoFormulario(dados);
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
      cidade_id: v.cidade_id,
      endereco: v.endereco ?? "",
      maps_url: v.maps_url,
      ensaio_ord: v.ensaio_ord,
      ensaio_dow: v.ensaio_dow,
      ensaio_hora: v.ensaio_hora,
      ensaio_meses: meses,
      observacoes: v.observacoes,
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

    // Cultos são regravados por inteiro: é mais simples e mais previsível que
    // tentar casar quais dias entraram e quais saíram.
    const { error: erroApagar } = await supabase
      .from("congregacao_cultos")
      .delete()
      .eq("congregacao_id", id);
    if (erroApagar) throw erroApagar;

    if (cultos.length > 0) {
      const { error: erroCultos } = await supabase
        .from("congregacao_cultos")
        .insert(cultos.map((k) => ({ congregacao_id: id!, dow: k.dow, hora: k.hora })));
      if (erroCultos) throw erroCultos;
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

// ---------------------------------------------------------------------------
// Cidades
//
// Mesma área de permissão das congregações: quem cadastra comum cadastra a
// cidade dela. Não vira uma área própria no menu porque são poucas linhas e o
// assunto é o mesmo.
// ---------------------------------------------------------------------------

const esquemaCidade = z.object({
  id: textoOpcional,
  nome: textoObrigatorio("Nome"),
  uf: z
    .string()
    .optional()
    .transform((s) => {
      const v = (s ?? "").trim().toUpperCase();
      return v === "" ? null : v;
    })
    .refine((v) => v === null || /^[A-Z]{2}$/.test(v), { message: "use a sigla de 2 letras" }),
  ativo: marcado,
});

export async function salvarCidade(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("congregacoes", esquemaCidade, dados, async (v, supabase) => {
    const registro = { nome: v.nome, uf: v.uf, ativo: v.ativo };

    const { error } = v.id
      ? await supabase.from("cidades").update(registro).eq("id", v.id)
      : await supabase.from("cidades").insert(registro);

    if (error) throw error;
  });
}

export async function excluirCidade(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("congregacoes", esquemaId, dados, async (v, supabase) => {
    const { count } = await supabase
      .from("congregacoes")
      .select("*", { count: "exact", head: true })
      .eq("cidade_id", v.id);

    if ((count ?? 0) > 0) {
      throw new Error(
        `Esta cidade tem ${count} comum(ns) ligada(s) a ela. Mude a cidade dessas comuns antes de excluí-la.`,
      );
    }

    const { error } = await supabase.from("cidades").delete().eq("id", v.id);
    if (error) throw error;
  });
}
