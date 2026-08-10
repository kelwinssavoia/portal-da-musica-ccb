/** Tamanho mínimo de senha, igual no formulário e na validação do servidor. */
export const SENHA_MINIMA = 10;

/**
 * Gera uma senha temporária legível para ditar por telefone.
 *
 * Sem caracteres ambíguos (l, I, 1, O, 0) porque quem recebe vai digitar à mão.
 * É provisória de propósito: quem entra deve trocá-la em /admin/senha.
 */
export function senhaTemporaria(): string {
  const alfabeto = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}
