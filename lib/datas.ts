/**
 * Datas e rótulos em português.
 *
 * Fuso fixo em America/Sao_Paulo: "hoje" é o hoje da regional, não o do relógio
 * de quem acessa. Sem isso, um irmão viajando veria o destaque de ensaio no dia
 * errado.
 */

export const FUSO = "America/Sao_Paulo";

export const DIAS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const MESES_CURTO = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

/** 1..4 = n-ésima ocorrência no mês; 5 = último. */
export const ORDINAIS: Record<number, string> = {
  1: "1º",
  2: "2º",
  3: "3º",
  4: "4º",
  5: "Último",
};

/** Data de hoje no fuso da regional, como `YYYY-MM-DD`. */
export function hojeISO(): string {
  // en-CA formata como YYYY-MM-DD, que é o formato do banco.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** `"19:30:00"` → `"19h30"`; `"19:00:00"` → `"19h"`. */
export function formatarHora(hora: string | null): string {
  if (!hora) return "";
  const [h, m] = hora.split(":");
  return m && m !== "00" ? `${h}h${m}` : `${h}h`;
}

/** `0, "18:30:00"` → `"Dom · 18h30"`. */
export function diaEHora(dow: number | null, hora: string | null): string {
  if (dow === null) return formatarHora(hora);
  const dia = DIAS_CURTO[dow] ?? "";
  const h = formatarHora(hora);
  return h ? `${dia} · ${h}` : dia;
}

/** `3, 0, "18:30:00"` → `"3º Domingo · 18h30"`. */
export function padraoEnsaio(
  ord: number | null,
  dow: number | null,
  hora: string | null,
): string {
  if (ord === null || dow === null) return "";
  const base = `${ORDINAIS[ord] ?? ord + "º"} ${DIAS[dow]}`;
  const h = formatarHora(hora);
  return h ? `${base} · ${h}` : base;
}

/** `null` → `"Todo mês"`; `[3,6,9,12]` → `"Meses: Mar, Jun, Set, Dez"`. */
export function frequenciaEnsaio(meses: number[] | null): string {
  if (!meses || meses.length === 0 || meses.length === 12) return "Todo mês";
  const nomes = [...meses].sort((a, b) => a - b).map((m) => MESES_CURTO[m - 1]);
  return `Meses: ${nomes.join(", ")}`;
}

/** `"2026-08-15"` → `"15 de agosto de 2026"`. */
export function dataLonga(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return `${dia} de ${MESES[mes - 1].toLowerCase()} de ${ano}`;
}

/** `"2026-08-15"` → `"15 ago"`. */
export function dataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-").map(Number);
  return `${dia} ${MESES_CURTO[mes - 1].toLowerCase()}`;
}

/**
 * Lista de cultos em texto: `"Dom · 09h e 18h30 · Qua · 19h30"` fica confuso,
 * então o formato é `"Dom 09h, Dom 18h30, Qua 19h30"` — cada culto por inteiro,
 * na ordem da semana.
 */
export function cultosEmTexto(cultos: { dow: number; hora: string | null }[]): string {
  return [...cultos]
    .sort((a, b) => a.dow - b.dow || (a.hora ?? "").localeCompare(b.hora ?? ""))
    .map((c) => {
      const h = formatarHora(c.hora);
      return h ? `${DIAS_CURTO[c.dow]} ${h}` : DIAS_CURTO[c.dow];
    })
    .join(", ");
}

/** `"2026-11-02"` → `"02/11"`. */
export function dataNumerica(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/** Período em texto: `"1 de novembro a 31 de dezembro de 2026"`. */
export function periodoEmTexto(inicio: string, fim: string): string {
  const [ai, mi, di] = inicio.split("-").map(Number);
  const [af] = fim.split("-").map(Number);
  const comeco = ai === af ? `${di} de ${MESES[mi - 1].toLowerCase()}` : dataLonga(inicio);
  return `${comeco} a ${dataLonga(fim)}`;
}
