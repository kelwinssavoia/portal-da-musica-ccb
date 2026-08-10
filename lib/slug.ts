/**
 * Identificador de URL/caminho: minúsculas, sem acento, com hífen.
 *
 * Fica fora de `lib/acoes.ts` porque aquele módulo é server-only, e esta função
 * é usada também no navegador, para montar o caminho do arquivo no Storage.
 */
export function paraSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Caminho aceitável dentro de um bucket.
 *
 * O caminho chega do navegador, então é conferido no servidor: sem `..`, sem
 * barra inicial, só os caracteres que a gente mesmo gera.
 */
export function caminhoValido(caminho: string): boolean {
  if (caminho === "" || caminho.length > 200) return false;
  if (caminho.includes("..") || caminho.startsWith("/")) return false;
  return /^[a-z0-9][a-z0-9/_.-]*$/.test(caminho);
}
