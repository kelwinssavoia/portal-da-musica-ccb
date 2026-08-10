"use client";

import { useState } from "react";

import { prepararFoto } from "@/lib/imagem";
import { paraSlug } from "@/lib/slug";
import { clienteNavegador } from "@/lib/supabase/navegador";

/**
 * Envio de arquivo **direto do navegador para o Storage**.
 *
 * O arquivo não passa pela Server Action de propósito: Server Action tem limite
 * de 1 MB de corpo, e a Vercel corta requisição em 4,5 MB — uma foto de celular
 * ou um PDF de circular estouraria os dois. Aqui o navegador sobe o arquivo,
 * guarda o caminho num campo escondido, e a ação só grava esse caminho.
 *
 * Quem já tem arquivo mantém o **mesmo caminho** na substituição, para o
 * endereço público não mudar e o link que alguém guardou continuar valendo.
 */
export function CampoUpload({
  nome,
  rotulo,
  bucket,
  aceita,
  limiteMb,
  caminhoAtual,
  nomeAtual,
  versaoAtual,
  imagem = false,
  ajuda,
}: {
  /** Prefixo dos campos escondidos: `<nome>_path`, `<nome>_nome`, `<nome>_novo`. */
  nome: string;
  rotulo: string;
  bucket: string;
  aceita: string;
  limiteMb: number;
  caminhoAtual?: string | null;
  nomeAtual?: string | null;
  versaoAtual?: number;
  /** Redimensiona e converte para JPEG antes de subir. */
  imagem?: boolean;
  ajuda?: string;
}) {
  const [estado, setEstado] = useState<"parado" | "enviando" | "pronto">("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [caminho, setCaminho] = useState(caminhoAtual ?? "");
  const [nomeArquivo, setNomeArquivo] = useState(nomeAtual ?? "");
  const [enviouAgora, setEnviouAgora] = useState(false);

  async function selecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const escolhido = e.target.files?.[0];
    if (!escolhido) return;

    setErro(null);
    setEstado("enviando");

    try {
      let corpo: Blob = escolhido;
      let extensao = escolhido.name.split(".").pop()?.toLowerCase() || "bin";

      if (imagem) {
        const pronta = await prepararFoto(escolhido);
        corpo = pronta.arquivo;
        extensao = pronta.extensao;
      }

      if (corpo.size > limiteMb * 1024 * 1024) {
        throw new Error(
          `O arquivo tem ${(corpo.size / 1024 / 1024).toFixed(1)} MB e o limite é ${limiteMb} MB.`,
        );
      }

      // Mantém o caminho na substituição; cria um novo quando não havia arquivo
      // ou quando a extensão mudou (não se serve um .pdf num endereço .jpg).
      const manter = caminhoAtual && caminhoAtual.endsWith(`.${extensao}`) ? caminhoAtual : null;
      const destino =
        manter ??
        `${paraSlug(escolhido.name.replace(/\.[^.]+$/, "")) || "arquivo"}-${sufixo()}.${extensao}`;

      const { error } = await clienteNavegador()
        .storage.from(bucket)
        .upload(destino, corpo, { upsert: true, contentType: corpo.type || undefined });

      if (error) throw error;

      setCaminho(destino);
      setNomeArquivo(escolhido.name);
      setEnviouAgora(true);
      setEstado("pronto");
    } catch (falha) {
      console.error("[cms] falha ao enviar arquivo:", falha);
      setErro(
        falha instanceof Error && falha.message.startsWith("O arquivo tem")
          ? falha.message
          : "Não foi possível enviar o arquivo. Verifique a conexão e tente de novo.",
      );
      setEstado("parado");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={nome} className="text-azul text-[12.5px] font-bold">
        {rotulo}
      </label>

      <input
        id={nome}
        type="file"
        accept={aceita}
        onChange={selecionar}
        disabled={estado === "enviando"}
        className="text-azul w-full text-[12.5px]"
      />

      {/* O que a Server Action recebe: só texto. */}
      <input type="hidden" name={`${nome}_path`} value={caminho} />
      <input type="hidden" name={`${nome}_nome`} value={nomeArquivo} />
      <input type="hidden" name={`${nome}_novo`} value={enviouAgora ? "sim" : ""} />

      {estado === "enviando" && (
        <span className="text-[12px]">Enviando o arquivo… não feche a página.</span>
      )}

      {estado === "pronto" && (
        <span className="text-verde text-[12px] font-bold">
          Arquivo enviado. Agora salve o registro para valer.
        </span>
      )}

      {erro && <span className="text-vermelho text-[12px]">{erro}</span>}

      {estado === "parado" && caminhoAtual && (
        <span className="text-[11.5px] opacity-70">
          Já existe um arquivo{nomeAtual ? ` (${nomeAtual})` : ""}
          {versaoAtual && versaoAtual > 1 ? `, versão ${versaoAtual}` : ""}. Escolher outro
          substitui mantendo o mesmo endereço.
        </span>
      )}

      {ajuda && estado === "parado" && !caminhoAtual && (
        <span className="text-[11.5px] opacity-70">{ajuda}</span>
      )}
    </div>
  );
}

/** Sufixo curto para o caminho não colidir entre arquivos de nome igual. */
function sufixo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
