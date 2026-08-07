/**
 * Leitura das variáveis de ambiente do Supabase.
 *
 * O portal precisa subir mesmo sem Supabase configurado: quem clona o
 * repositório roda `npm run dev` antes de criar o projeto, e as telas devem
 * mostrar os textos padrão em vez de estourar erro.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Chave publicável (antiga "anon key"). Segura no navegador — sujeita à RLS. */
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** Há Supabase configurado neste ambiente? */
export function supabaseConfigurado(): boolean {
  return SUPABASE_URL !== "" && SUPABASE_PUBLISHABLE_KEY !== "";
}

/** Mensagem única para quando falta configuração num caminho que exige banco. */
export const SEM_CONFIG =
  "Supabase não configurado. Copie .env.example para .env.local e preencha " +
  "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
  "Guia em docs/ARQUITETURA.md §9.";
