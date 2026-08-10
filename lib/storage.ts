import { SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Endereço público de um arquivo do Storage.
 *
 * `versao` entra como `?v=` para furar o cache do CDN: substituir um arquivo
 * grava no mesmo caminho, então sem isso quem já abriu continuaria vendo a
 * versão antiga. É o que permite o link do arquivo nunca mudar.
 */
export function urlPublica(bucket: string, caminho: string, versao?: number): string {
  const base = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${caminho}`;
  return versao && versao > 1 ? `${base}?v=${versao}` : base;
}

type ItemComArquivo = {
  origem: "upload" | "link";
  arquivo_path: string | null;
  url: string | null;
  versao?: number;
};

/** Endereço do arquivo de um item, seja ele hospedado aqui ou link externo. */
function urlDe(bucket: string, item: ItemComArquivo): string | null {
  if (item.origem === "link") return item.url;
  if (!item.arquivo_path) return null;
  return urlPublica(bucket, item.arquivo_path, item.versao);
}

export function urlDoArquivo(item: ItemComArquivo): string | null {
  return urlDe("arquivos", item);
}

export function urlDaCircular(item: ItemComArquivo): string | null {
  return urlDe("circulares", item);
}
