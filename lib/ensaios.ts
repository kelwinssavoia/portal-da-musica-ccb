/**
 * Recorrência de ensaio local.
 *
 * Ensaio local não é linha no banco: cada comum declara um **padrão** — ordinal
 * (1º…4º ou último), dia da semana, hora e em quais meses acontece — e as datas
 * são geradas daqui. `ensaio_excecoes` sobrepõe uma data específica, para
 * cancelar ou remanejar.
 *
 * Tudo aqui é função pura, sem fuso e sem relógio: datas entram e saem como
 * `YYYY-MM-DD`, que ordena corretamente por comparação de texto. As contas usam
 * UTC de propósito — `new Date(ano, mes, dia)` no horário local muda o dia em
 * alguns fusos.
 */

export type PadraoEnsaio = {
  id: string;
  nome: string;
  slug: string;
  /** 1..4 = n-ésima ocorrência no mês; 5 = último. */
  ensaio_ord: number | null;
  /** 0 = domingo … 6 = sábado. */
  ensaio_dow: number | null;
  ensaio_hora: string | null;
  /** null = todo mês. Lista 1..12 quando o ensaio não é mensal. */
  ensaio_meses: number[] | null;
};

export type Excecao = {
  congregacao_id: string;
  data_original: string;
  cancelado: boolean;
  nova_data: string | null;
  nova_hora: string | null;
  motivo: string | null;
};

export type Evento = {
  /** Estável: para ensaio gerado é `ensaio:<congregacao>:<data original>`. */
  id: string;
  tipoId: string;
  titulo: string;
  data: string;
  hora: string | null;
  congregacaoId: string | null;
  congregacaoNome: string | null;
  congregacaoSlug: string | null;
  descricao: string | null;
  /** Veio do padrão da comum, não da tabela `eventos`. */
  gerado: boolean;
};

export const TIPO_ENSAIO_LOCAL = "local";

// ---------------------------------------------------------------------------
// Calendário básico
// ---------------------------------------------------------------------------

export function diasNoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Dia da semana do dia 1 do mês. 0 = domingo. */
export function dowDoPrimeiro(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
}

/**
 * Dia do mês da n-ésima (1..4) ocorrência de um dia da semana.
 * `null` quando o mês não tem aquela ocorrência (ex.: 5ª segunda).
 */
export function nthDia(ano: number, mes: number, dow: number, ord: number): number | null {
  const dia = 1 + ((dow - dowDoPrimeiro(ano, mes) + 7) % 7) + (ord - 1) * 7;
  return dia > diasNoMes(ano, mes) ? null : dia;
}

/** Dia do mês da última ocorrência de um dia da semana. Sempre existe. */
export function ultimoDia(ano: number, mes: number, dow: number): number {
  const ultimo = diasNoMes(ano, mes);
  const dowDoUltimo = new Date(Date.UTC(ano, mes - 1, ultimo)).getUTCDay();
  return ultimo - ((dowDoUltimo - dow + 7) % 7);
}

/** Resolve o padrão (ordinal + dia da semana) num dia do mês. */
export function diaDoPadrao(
  ano: number,
  mes: number,
  ord: number,
  dow: number,
): number | null {
  return ord === 5 ? ultimoDia(ano, mes, dow) : nthDia(ano, mes, dow, ord);
}

export function iso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function partesISO(data: string): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = data.split("-").map(Number);
  return { ano, mes, dia };
}

/** Lista de (ano, mês) de `de` até `ate`, inclusive nas duas pontas. */
export function mesesEntre(de: string, ate: string): { ano: number; mes: number }[] {
  const inicio = partesISO(de);
  const fim = partesISO(ate);
  const meses: { ano: number; mes: number }[] = [];

  let ano = inicio.ano;
  let mes = inicio.mes;

  while (ano < fim.ano || (ano === fim.ano && mes <= fim.mes)) {
    meses.push({ ano, mes });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
  return meses;
}

/** Desloca uma data ISO em meses, mantendo o dia 1 (uso interno de janelas). */
function deslocarMes(data: string, delta: number): string {
  const { ano, mes } = partesISO(data);
  const total = ano * 12 + (mes - 1) + delta;
  return iso(Math.floor(total / 12), (total % 12) + 1, 1);
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

function temPadrao(p: PadraoEnsaio): boolean {
  return p.ensaio_ord !== null && p.ensaio_dow !== null;
}

/** `null` ou lista vazia = todo mês. */
export function mesesDoPadrao(meses: number[] | null): number[] {
  return meses && meses.length > 0 ? meses : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
}

/** Datas que o padrão gera no intervalo, antes de aplicar exceções. */
export function datasDoPadrao(p: PadraoEnsaio, de: string, ate: string): string[] {
  if (!temPadrao(p)) return [];

  const meses = mesesDoPadrao(p.ensaio_meses);
  const datas: string[] = [];

  for (const { ano, mes } of mesesEntre(de, ate)) {
    if (!meses.includes(mes)) continue;

    const dia = diaDoPadrao(ano, mes, p.ensaio_ord!, p.ensaio_dow!);
    if (dia === null) continue;

    const data = iso(ano, mes, dia);
    if (data >= de && data <= ate) datas.push(data);
  }
  return datas;
}

function eventoDeEnsaio(p: PadraoEnsaio, dataOriginal: string, data: string, hora: string | null): Evento {
  return {
    // O id usa a data ORIGINAL: um ensaio remanejado continua sendo o mesmo
    // ensaio, e assim não duplica se aparecer em duas consultas.
    id: `ensaio:${p.id}:${dataOriginal}`,
    tipoId: TIPO_ENSAIO_LOCAL,
    titulo: "Ensaio local",
    data,
    hora,
    congregacaoId: p.id,
    congregacaoNome: p.nome,
    congregacaoSlug: p.slug,
    descricao: null,
    gerado: true,
  };
}

/**
 * Ensaios locais de todas as comuns no intervalo, com exceções aplicadas.
 *
 * A geração roda numa janela ampliada em um mês para cada lado: um ensaio
 * remanejado de fora para dentro do intervalo precisa aparecer, e um remanejado
 * para fora precisa sair.
 */
export function gerarEnsaios(
  padroes: PadraoEnsaio[],
  excecoes: Excecao[],
  de: string,
  ate: string,
): Evento[] {
  const deAmplo = deslocarMes(de, -1);
  const ateAmplo = deslocarMes(ate, 2); // dia 1 do mês seguinte ao próximo
  const eventos: Evento[] = [];

  for (const p of padroes) {
    const excecoesDaComum = new Map(
      excecoes.filter((e) => e.congregacao_id === p.id).map((e) => [e.data_original, e]),
    );

    for (const dataOriginal of datasDoPadrao(p, deAmplo, ateAmplo)) {
      const excecao = excecoesDaComum.get(dataOriginal);

      if (excecao?.cancelado) continue;

      const data = excecao?.nova_data ?? dataOriginal;
      const hora = excecao?.nova_hora ?? p.ensaio_hora;

      if (data < de || data > ate) continue;

      eventos.push(eventoDeEnsaio(p, dataOriginal, data, hora));
    }
  }
  return eventos;
}

/**
 * Próximo ensaio de uma comum a partir de uma data (inclusive).
 *
 * Olha 14 meses à frente: cobre o pior caso, um ensaio anual cuja próxima
 * ocorrência está quase um ano depois.
 */
export function proximoEnsaio(
  p: PadraoEnsaio,
  excecoes: Excecao[],
  apartirDe: string,
): Evento | null {
  const fim = deslocarMes(apartirDe, 14);
  const eventos = gerarEnsaios([p], excecoes, apartirDe, fim);
  eventos.sort((a, b) => a.data.localeCompare(b.data));
  return eventos[0] ?? null;
}

/** Ordena por data e, no mesmo dia, por hora. Sem hora vai por último. */
export function ordenarEventos(eventos: Evento[]): Evento[] {
  return [...eventos].sort(
    (a, b) => a.data.localeCompare(b.data) || (a.hora ?? "99").localeCompare(b.hora ?? "99"),
  );
}
