/**
 * Busca global.
 *
 * Comparação sem acento e sem caixa: quem digita "agua comprida" ou "ORGANISTA"
 * precisa achar. São funções puras, testadas — a montagem dos resultados a
 * partir do banco fica em `lib/dados/busca.ts`.
 */

export type AreaBusca =
  | "Congregações"
  | "Ensaios"
  | "Calendário"
  | "Circulares"
  | "Secretaria"
  | "Dúvidas";

export type Resultado = {
  area: AreaBusca;
  titulo: string;
  sub: string;
  href: string;
  /** Maior = mais relevante. Ver `pontuar`. */
  pontos: number;
};

/** Minúsculas, sem acento, espaços colapsados. */
export function normalizar(texto: string): string {
  return String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Termos da consulta, já normalizados. Vazio quando não há busca. */
export function termosDe(consulta: string): string[] {
  const n = normalizar(consulta);
  return n === "" ? [] : n.split(" ");
}

/**
 * Relevância de um texto para os termos buscados:
 *
 * - 3 pontos quando o texto **começa** com o termo
 * - 2 pontos quando alguma **palavra** começa com o termo
 * - 1 ponto quando aparece no meio
 * - 0 quando não aparece
 *
 * Todos os termos precisam aparecer (E, não OU): buscar "ficha organista" não
 * traz as fichas de músico.
 *
 * Normaliza os termos aqui também, e não só o texto: passar um termo acentuado
 * direto devolveria zero em silêncio, que é o pior tipo de erro numa busca.
 */
export function pontuar(texto: string, termos: string[]): number {
  if (termos.length === 0) return 0;

  const alvo = normalizar(texto);
  let total = 0;

  for (const bruto of termos) {
    const termo = normalizar(bruto);
    if (termo === "") continue;

    const pos = alvo.indexOf(termo);
    if (pos === -1) return 0;

    if (pos === 0) total += 3;
    else if (alvo[pos - 1] === " ") total += 2;
    else total += 1;
  }
  return total;
}

/**
 * Pontua um item por vários campos, pesando o primeiro campo (o título) mais
 * que o resto — casar no título vale mais que casar na descrição.
 */
export function pontuarCampos(campos: string[], termos: string[]): number {
  const titulo = pontuar(campos[0] ?? "", termos);
  if (titulo > 0) return titulo * 10;

  const resto = pontuar(campos.slice(1).join(" "), termos);
  return resto;
}

/** Ordena por relevância e, no empate, alfabeticamente. */
export function ordenarResultados(resultados: Resultado[]): Resultado[] {
  return [...resultados].sort(
    (a, b) => b.pontos - a.pontos || a.titulo.localeCompare(b.titulo, "pt-BR"),
  );
}

export type GrupoBusca = {
  area: AreaBusca;
  itens: Resultado[];
  /** Quantos existem na área, mesmo que `itens` esteja limitado. */
  total: number;
};

/** Máximo de resultados exibidos por área, para a lista não virar ruído. */
export const LIMITE_POR_AREA = 8;

/**
 * Agrupa por área, preservando a ordem de relevância dentro de cada grupo.
 *
 * `total` sempre diz quantos existem de verdade — a tela mostra "e mais N",
 * em vez de cortar em silêncio e dar a impressão de que aquilo é tudo.
 */
export function agruparPorArea(
  resultados: Resultado[],
  limite = LIMITE_POR_AREA,
): GrupoBusca[] {
  const grupos = new Map<AreaBusca, Resultado[]>();

  for (const r of ordenarResultados(resultados)) {
    const atual = grupos.get(r.area);
    if (atual) atual.push(r);
    else grupos.set(r.area, [r]);
  }

  return [...grupos.entries()].map(([area, itens]) => ({
    area,
    itens: itens.slice(0, limite),
    total: itens.length,
  }));
}

/**
 * Remove repetição mantendo a primeira ocorrência de cada chave.
 *
 * Usado no calendário: um ensaio que acontece todo mês geraria uma dezena de
 * resultados idênticos, e o que interessa é o próximo. Como os eventos chegam
 * ordenados por data, a primeira ocorrência já é a mais próxima.
 */
export function primeiraDeCada<T>(itens: T[], chave: (item: T) => string): T[] {
  const vistas = new Set<string>();
  const unicos: T[] = [];

  for (const item of itens) {
    const k = chave(item);
    if (vistas.has(k)) continue;
    vistas.add(k);
    unicos.push(item);
  }
  return unicos;
}
