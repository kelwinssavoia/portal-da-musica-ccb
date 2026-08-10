import type { Cidade } from "@/lib/tipos-banco";

/**
 * Nome da cidade com a UF, quando houver: `"Bragança Paulista/SP"`.
 *
 * Fica separado de `lib/dados/cidades.ts` porque aquele módulo consulta o banco
 * e não pode ser importado por Client Component — e esta função é usada nos
 * formulários do CMS, que rodam no navegador.
 */
export function nomeDaCidade(c: Pick<Cidade, "nome" | "uf">): string {
  return c.uf ? `${c.nome}/${c.uf}` : c.nome;
}
