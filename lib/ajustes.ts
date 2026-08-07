/**
 * Ajustes do portal (textos institucionais e opções gerais).
 *
 * Fase 1: valores vêm daqui. Na fase 2 esta função passa a ler a tabela
 * `ajustes` do Supabase — a assinatura já é assíncrona justamente para que a
 * troca não exija mexer em nenhuma tela.
 */

export type Ajustes = {
  /** Faixa institucional do topo. */
  instituicao: string;
  /** Nome da região. Aparece na faixa e no rodapé. */
  regiao: string;
  /** Título grande do cabeçalho. */
  titulo: string;
  /** Linha abaixo do título. */
  subtitulo: string;
  /** Primeira linha do rodapé. */
  localidade: string;
  /** Contato do rodapé. Vazio = não aparece. */
  contato: string;
  /** Texto de apresentação da tela de Início. */
  heroTexto: string;
  /** Nota final do rodapé. */
  rodapeNota: string;
  /** Se o portal pode aparecer em buscadores. Ver docs/ARQUITETURA.md §8.1. */
  indexavel: boolean;
};

const PADRAO: Ajustes = {
  instituicao: "Congregação Cristã no Brasil · Música",
  regiao: "Região Bragantina",
  titulo: "Portal da Música",
  subtitulo: "Região Bragantina · Secretaria da Música",
  localidade: "Região Bragantina — Bragança Paulista/SP",
  contato: "",
  heroTexto:
    "Um lugar só para as informações da música da regional: congregações, " +
    "ensaios, calendário, circulares e os arquivos da secretaria.",
  rodapeNota:
    "Projeto open-source, mantido por voluntário. Não é um canal oficial da " +
    "Congregação Cristã no Brasil.",
  indexavel: true,
};

export async function getAjustes(): Promise<Ajustes> {
  return PADRAO;
}

/** URL pública do portal. Usada em metadata, sitemap e link mágico. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
