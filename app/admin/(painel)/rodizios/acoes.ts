"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { acao, ErroDeUso, marcado, textoObrigatorio, type Resultado } from "@/lib/acoes";
import { periodoValido } from "@/lib/rodizio";

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dow = z.number().int().min(0).max(6);

/**
 * O editor manda o rodízio inteiro como JSON num campo só: são listas aninhadas
 * (organistas com restrições, escala com uma linha por culto) que não cabem
 * bem em pares nome/valor de formulário.
 */
const rodizio = z
  .object({
    id: z.string().uuid().nullable(),
    congregacao_id: z.string().uuid({ message: "escolha a comum" }),
    inicio: data,
    fim: data,
    observacoes: z.string().max(500).nullable(),
    organistas: z
      .array(
        z.object({
          chave: z.string().min(1),
          id: z.string().uuid().nullable(),
          nome: z
            .string()
            .transform((s) => s.trim())
            .refine((s) => s.length > 0 && s.length <= 80, { message: "nome inválido" }),
          dows_indisponiveis: z.array(dow),
          datas_indisponiveis: z.array(data),
        }),
      )
      .min(1, { message: "inclua ao menos uma organista" }),
    escala: z
      .array(
        z.object({
          data,
          hora: z.string().nullable(),
          organista: z.string().nullable(),
          fixo: z.boolean(),
        }),
      )
      .min(1, { message: "gere o rodízio antes de salvar" }),
  })
  .refine((r) => periodoValido(r.inicio, r.fim), {
    message: "período inválido (o fim vem depois do início, e no máximo um ano)",
  })
  .refine((r) => new Set(r.escala.map((e) => e.data)).size === r.escala.length, {
    message: "há duas linhas com a mesma data na escala",
  });

const esquema = z.object({
  payload: z
    .string()
    .transform((s, ctx) => {
      try {
        return JSON.parse(s) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "dados do rodízio ilegíveis" });
        return z.NEVER;
      }
    })
    .pipe(rodizio),
});

export async function salvarRodizio(_: unknown, dados: FormData): Promise<Resultado> {
  let salvo: string | null = null;

  const resultado = await acao("rodizios", esquema, dados, async ({ payload }, supabase) => {
    const { data: id, error } = await supabase.rpc("salvar_rodizio", { dados: payload });
    if (error) throw error;
    salvo = id;
  });

  // Recarrega a página do rodízio também ao editar: o editor remonta com o que
  // está no banco, e quem foi cadastrada agora passa a ter id. Sem isso, salvar
  // de novo tentaria cadastrá-la outra vez.
  //
  // Fora do `acao`: o redirect funciona lançando uma exceção, que o envelope
  // trataria como erro de gravação.
  if (resultado.ok && salvo) redirect(`/admin/rodizios/${salvo}?salvo=1`);
  return resultado;
}

const esquemaId = z.object({ id: textoObrigatorio("Registro") });

export async function excluirRodizio(_: unknown, dados: FormData): Promise<Resultado> {
  const resultado = await acao("rodizios", esquemaId, dados, async (v, supabase) => {
    const { error } = await supabase.from("rodizios").delete().eq("id", v.id);
    if (error) throw error;
  });

  if (resultado.ok) redirect("/admin/rodizios");
  return resultado;
}

// ---------------------------------------------------------------------------
// Organistas
//
// O cadastro nasce no próprio editor de rodízio (quem é nova entra ali). Aqui
// fica só a manutenção: corrigir nome, tirar do rodízio, excluir.
// ---------------------------------------------------------------------------

const esquemaOrganista = z.object({
  id: textoObrigatorio("Registro"),
  nome: textoObrigatorio("Nome"),
  ativo: marcado,
});

export async function salvarOrganista(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("rodizios", esquemaOrganista, dados, async (v, supabase) => {
    const { error } = await supabase
      .from("organistas")
      .update({ nome: v.nome, ativo: v.ativo })
      .eq("id", v.id);
    if (error) throw error;
  });
}

export async function excluirOrganista(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("rodizios", esquemaId, dados, async (v, supabase) => {
    const { count } = await supabase
      .from("rodizio_organistas")
      .select("*", { count: "exact", head: true })
      .eq("organista_id", v.id);

    if ((count ?? 0) > 0) {
      throw new ErroDeUso(
        `Ela está em ${count} rodízio(s) salvo(s). Para tirá-la dos próximos, desmarque "Participa dos rodízios".`,
      );
    }

    const { error } = await supabase.from("organistas").delete().eq("id", v.id);
    if (error) throw error;
  });
}
