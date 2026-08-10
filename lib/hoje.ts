import "server-only";

import { connection } from "next/server";

import { hojeISO } from "@/lib/datas";

/**
 * Data de hoje no fuso da regional, lida em **tempo de requisição**.
 *
 * O `connection()` é obrigatório: ler o relógio é valor instável e, sem essa
 * marcação, o Next tentaria congelar "hoje" no momento do build — o portal
 * ficaria destacando o ensaio do dia errado até o próximo deploy.
 *
 * Por isso "hoje" nunca é lido dentro de um escopo `use cache`: é calculado
 * aqui e passado como argumento para as funções cacheadas.
 */
export async function hoje(): Promise<string> {
  await connection();
  return hojeISO();
}
