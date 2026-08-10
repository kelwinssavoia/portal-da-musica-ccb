"use client";

import { useEffect, useRef, useState } from "react";

import { prepararFoto } from "@/lib/imagem";
import { paraSlug } from "@/lib/slug";
import { urlPublica } from "@/lib/storage";
import { clienteNavegador } from "@/lib/supabase/navegador";

type Estado = "vazio" | "enviando" | "pronto" | "erro";

/**
 * Seleção e envio de arquivo.
 *
 * O `<input type="file">` nativo não aceita estilo e mostra um botão diferente
 * em cada navegador, então ele fica escondido e a área visível é nossa: botão,
 * arrastar-e-soltar, miniatura da imagem e nome do arquivo.
 *
 * O arquivo vai do navegador **direto para o Storage**, não pela Server Action:
 * Server Action tem limite de 1 MB de corpo e a Vercel corta requisição em
 * 4,5 MB — foto de celular e PDF de circular estouram os dois. A ação recebe só
 * o caminho, nos campos escondidos.
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
  /** Reduz e converte para JPEG antes de subir. */
  imagem?: boolean;
  ajuda?: string;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>("vazio");
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  const [caminho, setCaminho] = useState(caminhoAtual ?? "");
  const [nomeArquivo, setNomeArquivo] = useState(nomeAtual ?? "");
  const [tamanho, setTamanho] = useState<number | null>(null);
  const [enviouAgora, setEnviouAgora] = useState(false);
  const [previa, setPrevia] = useState<string | null>(
    imagem && caminhoAtual ? urlPublica(bucket, caminhoAtual, versaoAtual) : null,
  );

  // A prévia local vira um endereço temporário na memória; sem liberar, a
  // imagem fica presa ali até a página sair.
  useEffect(() => {
    return () => {
      if (previa?.startsWith("blob:")) URL.revokeObjectURL(previa);
    };
  }, [previa]);

  async function processar(escolhido: File) {
    setErro(null);
    setEstado("enviando");

    try {
      let corpo: Blob = escolhido;
      let extensao = escolhido.name.split(".").pop()?.toLowerCase() || "bin";

      if (imagem) {
        const pronta = await prepararFoto(escolhido);
        corpo = pronta.arquivo;
        extensao = pronta.extensao;
        setPrevia(URL.createObjectURL(corpo));
      }

      if (corpo.size > limiteMb * 1024 * 1024) {
        throw new Error(
          `O arquivo tem ${tamanhoEmTexto(corpo.size)} e o limite é ${limiteMb} MB.`,
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
      setTamanho(corpo.size);
      setEnviouAgora(true);
      setEstado("pronto");
    } catch (falha) {
      console.error("[cms] falha ao enviar arquivo:", falha);
      setErro(
        falha instanceof Error && falha.message.startsWith("O arquivo tem")
          ? falha.message
          : "Não foi possível enviar o arquivo. Verifique a conexão e tente de novo.",
      );
      setEstado("erro");
    }
  }

  function aoSoltar(e: React.DragEvent) {
    e.preventDefault();
    setArrastando(false);
    const arquivo = e.dataTransfer.files?.[0];
    if (arquivo) void processar(arquivo);
  }

  const temArquivo = estado === "pronto" || (estado === "vazio" && Boolean(caminhoAtual));
  const enviando = estado === "enviando";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-azul text-[12.5px] font-bold">{rotulo}</span>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltar}
        className={`rounded-portal border-2 border-dashed p-4 transition-colors ${
          arrastando ? "border-azul bg-azul/5" : erro ? "border-vermelho" : "border-cinza bg-white"
        }`}
      >
        <input
          ref={entrada}
          id={nome}
          type="file"
          accept={aceita}
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) void processar(arquivo);
          }}
          className="sr-only"
        />

        <div className="flex flex-wrap items-center gap-3">
          {temArquivo && previa ? (
            // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:), não passa pelo otimizador
            <img
              src={previa}
              alt=""
              className="border-cinza size-16 shrink-0 rounded object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className={`grid size-16 shrink-0 place-items-center rounded ${
                temArquivo ? "bg-cinza" : "bg-fundo"
              }`}
            >
              {temArquivo ? <IconeDocumento /> : <IconeSubir />}
            </span>
          )}

          <div className="min-w-[180px] flex-1">
            {enviando ? (
              <>
                <p className="text-azul text-[12.5px] font-bold">Enviando…</p>
                <div className="bg-cinza mt-1.5 h-1.5 overflow-hidden rounded">
                  {/* Barra indeterminada: o Storage não informa quanto já subiu. */}
                  <div className="bg-azul h-full w-1/3 animate-pulse rounded" />
                </div>
                <p className="mt-1 text-[11.5px] opacity-70">Não feche a página.</p>
              </>
            ) : temArquivo ? (
              <>
                <p className="text-azul truncate text-[12.5px] font-bold">
                  {nomeArquivo || "Arquivo enviado"}
                </p>
                <p className="mt-0.5 text-[11.5px] opacity-70">
                  {estado === "pronto"
                    ? `Enviado${tamanho ? ` · ${tamanhoEmTexto(tamanho)}` : ""} · salve o registro para valer`
                    : `Já cadastrado${versaoAtual && versaoAtual > 1 ? ` · versão ${versaoAtual}` : ""}`}
                </p>
              </>
            ) : (
              <>
                <p className="text-[12.5px]">
                  Arraste o arquivo aqui ou escolha no seu aparelho.
                </p>
                {ajuda && <p className="mt-0.5 text-[11.5px] opacity-70">{ajuda}</p>}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={enviando}
            className={`rounded-portal shrink-0 px-3.5 py-2 text-[12.5px] font-bold disabled:opacity-60 ${
              temArquivo ? "border-cinza text-azul border bg-white" : "bg-azul text-white"
            }`}
          >
            {temArquivo ? "Trocar arquivo" : "Escolher arquivo"}
          </button>
        </div>

        {erro && <p className="text-vermelho mt-3 text-[12px]">{erro}</p>}
      </div>

      {/* O que a Server Action recebe: só texto. */}
      <input type="hidden" name={`${nome}_path`} value={caminho} />
      <input type="hidden" name={`${nome}_nome`} value={nomeArquivo} />
      <input type="hidden" name={`${nome}_novo`} value={enviouAgora ? "sim" : ""} />
    </div>
  );
}

function tamanhoEmTexto(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Sufixo curto para o caminho não colidir entre arquivos de nome igual. */
function sufixo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function IconeSubir() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-azul size-7 opacity-70"
    >
      <path d="M12 16V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function IconeDocumento() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-azul size-7 opacity-70"
    >
      <path d="M14 3v5h5" />
      <path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7z" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}
