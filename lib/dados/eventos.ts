import { cacheLife, cacheTag } from "next/cache";

import {
  gerarEnsaios,
  ordenarEventos,
  proximoEnsaio,
  TIPO_ENSAIO_LOCAL,
  type Evento,
  type Excecao,
  type PadraoEnsaio,
} from "@/lib/ensaios";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { clientePublico } from "@/lib/supabase/publico";
import type { Congregacao, TipoEvento } from "@/lib/tipos-banco";

function aviso(onde: string, erro: unknown) {
  console.error(`[portal] falha ao ler ${onde}:`, erro);
}

export type { Evento };

export async function listarTiposEvento(): Promise<TipoEvento[]> {
  "use cache";
  cacheTag("eventos");
  cacheLife("hours");

  if (!supabaseConfigurado()) return [];

  const { data, error } = await clientePublico()
    .from("tipos_evento")
    .select("*")
    .order("ordem");

  if (error) {
    aviso("tipos_evento", error);
    return [];
  }
  return data ?? [];
}

async function lerBase(): Promise<{
  congregacoes: Congregacao[];
  excecoes: Excecao[];
}> {
  "use cache";
  cacheTag("eventos", "congregacoes");
  cacheLife("hours");

  if (!supabaseConfigurado()) return { congregacoes: [], excecoes: [] };

  const supabase = clientePublico();
  const [congregacoes, excecoes] = await Promise.all([
    supabase.from("congregacoes").select("*").order("nome"),
    supabase.from("ensaio_excecoes").select("*"),
  ]);

  if (congregacoes.error || excecoes.error) {
    aviso("base de eventos", congregacoes.error ?? excecoes.error);
    return { congregacoes: [], excecoes: [] };
  }

  return { congregacoes: congregacoes.data ?? [], excecoes: excecoes.data ?? [] };
}

/**
 * **Fonte única de eventos de qualquer tela.**
 *
 * Une os ensaios locais gerados do padrão de cada comum (§5.1 da arquitetura)
 * aos eventos avulsos da tabela `eventos`, resolve o nome da comum de cada um e
 * devolve tudo ordenado. Calendário, agenda, Início, Ensaios e busca consomem
 * esta mesma lista — é o que faz o ensaio local aparecer no calendário como
 * qualquer outro evento.
 */
export async function eventosDoPeriodo(de: string, ate: string): Promise<Evento[]> {
  "use cache";
  cacheTag("eventos", "congregacoes");
  cacheLife("hours");

  if (!supabaseConfigurado()) return [];

  // As duas leituras vão juntas: o banco fica em São Paulo e cada ida e volta
  // custa tempo de rede. Em sequência, esta função demorava o dobro.
  const [{ congregacoes, excecoes }, avulsosResp] = await Promise.all([
    lerBase(),
    clientePublico().from("eventos").select("*").gte("data", de).lte("data", ate),
  ]);

  const { data: avulsos, error } = avulsosResp;
  if (error) aviso("eventos avulsos", error);

  const porId = new Map(congregacoes.map((c) => [c.id, c]));

  const doBanco: Evento[] = (avulsos ?? []).map((e) => {
    const c = e.congregacao_id ? porId.get(e.congregacao_id) : undefined;
    return {
      id: e.id,
      tipoId: e.tipo_id,
      titulo: e.titulo,
      data: e.data,
      hora: e.hora,
      congregacaoId: c?.id ?? null,
      congregacaoNome: c?.nome ?? null,
      congregacaoSlug: c?.slug ?? null,
      descricao: e.descricao,
      gerado: false,
    };
  });

  const gerados = gerarEnsaios(congregacoes as PadraoEnsaio[], excecoes, de, ate);

  return ordenarEventos([...gerados, ...doBanco]);
}

export type ComumComEnsaio = {
  congregacao: Congregacao;
  proximo: Evento | null;
};

/** Comuns com padrão de ensaio cadastrado, cada uma com seu próximo ensaio. */
export async function comunsComEnsaio(hoje: string): Promise<ComumComEnsaio[]> {
  "use cache";
  cacheTag("eventos", "congregacoes");
  cacheLife("hours");

  const { congregacoes, excecoes } = await lerBase();

  return congregacoes
    .filter((c) => c.ensaio_ord !== null && c.ensaio_dow !== null)
    .map((c) => ({
      congregacao: c,
      proximo: proximoEnsaio(c as PadraoEnsaio, excecoes, hoje),
    }));
}

/** Só os ensaios regionais a partir de hoje, para a lista da tela de Ensaios. */
export async function ensaiosRegionais(hoje: string, ate: string): Promise<Evento[]> {
  const eventos = await eventosDoPeriodo(hoje, ate);
  return eventos.filter((e) => e.tipoId === "regional");
}

export { TIPO_ENSAIO_LOCAL };
