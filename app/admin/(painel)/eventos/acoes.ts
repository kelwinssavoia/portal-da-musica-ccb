"use server";

import { z } from "zod";

import {
  acao,
  dataObrigatoria,
  dataOpcional,
  horaOpcional,
  marcado,
  textoObrigatorio,
  textoOpcional,
  type Resultado,
} from "@/lib/acoes";

const esquema = z.object({
  id: textoOpcional,
  tipo_id: textoObrigatorio("Tipo"),
  titulo: textoObrigatorio("Título"),
  data: dataObrigatoria,
  hora: horaOpcional,
  congregacao_id: textoOpcional,
  descricao: textoOpcional,
  ativo: marcado,
});

export async function salvarEvento(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("eventos", esquema, dados, async (v, supabase) => {
    // Ensaio local não é evento avulso: vem do padrão da comum. Deixar cadastrar
    // aqui criaria data duplicada no calendário.
    if (v.tipo_id === "local") {
      throw new Error(
        "Ensaio local não se cadastra aqui — ele vem do padrão da comum, em Congregações. " +
          "Para mudar uma data específica, use as exceções de ensaio nesta mesma tela.",
      );
    }

    const registro = {
      tipo_id: v.tipo_id,
      titulo: v.titulo,
      data: v.data,
      hora: v.hora,
      congregacao_id: v.congregacao_id,
      descricao: v.descricao,
      ativo: v.ativo,
    };

    const { error } = v.id
      ? await supabase.from("eventos").update(registro).eq("id", v.id)
      : await supabase.from("eventos").insert(registro);

    if (error) throw error;
  });
}

export async function excluirEvento(_: unknown, dados: FormData): Promise<Resultado> {
  return acao(
    "eventos",
    z.object({ id: textoObrigatorio("Registro") }),
    dados,
    async (v, supabase) => {
      const { error } = await supabase.from("eventos").delete().eq("id", v.id);
      if (error) throw error;
    },
  );
}

// ---------------------------------------------------------------------------
// Exceções de ensaio local
// ---------------------------------------------------------------------------

const esquemaExcecao = z.object({
  id: textoOpcional,
  congregacao_id: textoObrigatorio("Comum"),
  data_original: dataObrigatoria,
  cancelado: marcado,
  nova_data: dataOpcional,
  nova_hora: horaOpcional,
  motivo: textoOpcional,
});

export async function salvarExcecao(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("eventos", esquemaExcecao, dados, async (v, supabase) => {
    if (!v.cancelado && !v.nova_data && !v.nova_hora) {
      throw new Error(
        "Marque como cancelado, ou informe a nova data/hora. Do jeito que está, nada muda.",
      );
    }
    if (v.cancelado && (v.nova_data || v.nova_hora)) {
      throw new Error("Cancelado e remanejado ao mesmo tempo não faz sentido. Escolha um.");
    }

    const registro = {
      congregacao_id: v.congregacao_id,
      data_original: v.data_original,
      cancelado: v.cancelado,
      nova_data: v.nova_data,
      nova_hora: v.nova_hora,
      motivo: v.motivo,
    };

    // Uma exceção por comum e data original: repetir a mesma data é correção.
    const { error } = await supabase
      .from("ensaio_excecoes")
      .upsert(registro, { onConflict: "congregacao_id,data_original" });

    if (error) throw error;

    return v.cancelado
      ? "Ensaio cancelado nessa data. Ele deixa de aparecer no calendário."
      : "Ensaio remanejado. O calendário já mostra a data nova.";
  });
}

export async function excluirExcecao(_: unknown, dados: FormData): Promise<Resultado> {
  return acao(
    "eventos",
    z.object({ id: textoObrigatorio("Registro") }),
    dados,
    async (v, supabase) => {
      const { error } = await supabase.from("ensaio_excecoes").delete().eq("id", v.id);
      if (error) throw error;
      return "Exceção removida. O ensaio volta para a data normal do padrão.";
    },
  );
}
