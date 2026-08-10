import { partesISO } from "@/lib/ensaios";

/**
 * Destaque temporal de um evento: forte para hoje, suave para amanhã.
 * Vale em todas as visões, conforme §5.3 da arquitetura.
 *
 * `hoje` vem sempre de fora (calculado no fuso da regional, em tempo de
 * requisição) — nunca do relógio de quem acessa.
 */
export type Destaque = "hoje" | "amanha" | null;

/** Dia seguinte a uma data ISO, respeitando virada de mês e ano. */
export function amanhaDe(hoje: string): string {
  const { ano, mes, dia } = partesISO(hoje);
  const d = new Date(Date.UTC(ano, mes - 1, dia + 1));
  return d.toISOString().slice(0, 10);
}

export function destaqueDe(data: string, hoje: string): Destaque {
  if (data === hoje) return "hoje";
  if (data === amanhaDe(hoje)) return "amanha";
  return null;
}

/** Classes de moldura do card conforme o destaque. */
export function classeDestaque(destaque: Destaque): string {
  if (destaque === "hoje") return "border-vermelho bg-vermelho/5";
  if (destaque === "amanha") return "border-azul-link bg-azul-link/5";
  return "border-azul";
}

export function seloDestaque(destaque: Destaque): { texto: string; classe: string } | null {
  if (destaque === "hoje") return { texto: "Hoje", classe: "bg-vermelho text-white" };
  if (destaque === "amanha") return { texto: "Amanhã", classe: "bg-azul-link text-white" };
  return null;
}
