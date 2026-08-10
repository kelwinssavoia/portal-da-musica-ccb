/**
 * Redimensionamento de foto no navegador, antes de subir.
 *
 * Foto de celular tem 3 a 8 MB e uns 4000px de largura — muito mais do que o
 * portal usa (o card mostra ~340px, o detalhe ~640px). Reduzir aqui economiza a
 * cota do Storage, o tempo de envio de quem cadastra e a banda de quem acessa.
 */

/** Maior lado da imagem depois de reduzida. */
const LADO_MAXIMO = 1600;

/** Qualidade do JPEG resultante. 0,82 não mostra artefato em foto de fachada. */
const QUALIDADE = 0.82;

export type FotoPronta = { arquivo: Blob; extensao: string; largura: number; altura: number };

/**
 * Reduz a imagem e devolve um JPEG.
 *
 * Sempre converte para JPEG: HEIC de iPhone e PNG de 10 MB são os dois casos que
 * mais aparecem, e nenhum dos dois é bom para foto num site.
 */
export async function prepararFoto(arquivo: File): Promise<FotoPronta> {
  const bitmap = await carregarBitmap(arquivo);

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("O navegador não conseguiu processar a imagem.");

  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALIDADE),
  );

  if (!blob) throw new Error("Não foi possível converter a imagem.");

  return { arquivo: blob, extensao: "jpg", largura, altura };
}

/** `createImageBitmap` cobre HEIC onde o navegador sabe decodificar; `<img>` é a reserva. */
async function carregarBitmap(arquivo: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(arquivo);
  } catch {
    const url = URL.createObjectURL(arquivo);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
