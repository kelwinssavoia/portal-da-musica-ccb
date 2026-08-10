import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { paraSlug } from "@/lib/acoes";
import type { Database } from "@/lib/tipos-banco";

export const LIMITE_FOTO = 5 * 1024 * 1024;
export const LIMITE_ARQUIVO = 25 * 1024 * 1024;

const EXTENSOES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export function extensaoDe(arquivo: File): string {
  const porTipo = EXTENSOES[arquivo.type];
  if (porTipo) return porTipo;

  const doNome = arquivo.name.split(".").pop()?.toLowerCase();
  return doNome && /^[a-z0-9]{2,5}$/.test(doNome) ? doNome : "bin";
}

/** `FormData` devolve um File vazio quando nada foi escolhido. */
export function temArquivo(valor: unknown): valor is File {
  return valor instanceof File && valor.size > 0;
}

/**
 * Sobe um arquivo para o Storage, sobrescrevendo o caminho.
 *
 * O `upsert` é o coração da substituição versionada: subir uma versão nova grava
 * no MESMO caminho, então o endereço público do arquivo nunca muda e o link que
 * alguém salvou continua valendo. Quem fura o cache do CDN é o `?v=<versao>`,
 * que a tela acrescenta — ver `lib/storage.ts`.
 */
export async function subirArquivo(
  supabase: SupabaseClient<Database>,
  bucket: string,
  caminho: string,
  arquivo: File,
  limite: number,
): Promise<void> {
  if (arquivo.size > limite) {
    const mb = Math.floor(limite / (1024 * 1024));
    throw new Error(`O arquivo passa de ${mb} MB. Reduza o tamanho e tente de novo.`);
  }

  const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo, {
    upsert: true,
    contentType: arquivo.type || undefined,
  });

  if (error) throw error;
}

/** Caminho estável e legível: `<pasta>/<nome-em-slug>.<ext>`. */
export function caminhoDe(pasta: string, nome: string, arquivo: File): string {
  return `${paraSlug(pasta)}/${paraSlug(nome)}.${extensaoDe(arquivo)}`;
}

/** Remove um arquivo do Storage sem derrubar a operação se ele já não existir. */
export async function apagarArquivo(
  supabase: SupabaseClient<Database>,
  bucket: string,
  caminho: string | null,
): Promise<void> {
  if (!caminho) return;
  const { error } = await supabase.storage.from(bucket).remove([caminho]);
  if (error) console.error(`[cms] não foi possível apagar ${bucket}/${caminho}:`, error);
}
