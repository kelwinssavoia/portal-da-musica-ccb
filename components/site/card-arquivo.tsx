import { IconeArquivo } from "@/components/icone-arquivo";
import { urlDoArquivo } from "@/lib/storage";
import type { Arquivo } from "@/lib/tipos-banco";

const ROTULO_TIPO: Record<Arquivo["tipo"], string> = {
  pdf: "PDF",
  planilha: "Planilha",
  documento: "Documento",
  formulario: "Formulário",
  pasta: "Pasta",
  video: "Vídeo",
  link: "Link",
};

/** Card de um arquivo da Secretaria. Abre em nova aba. */
export function CardArquivo({ arquivo: a }: { arquivo: Arquivo }) {
  const href = urlDoArquivo(a);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-superficie border-azul shadow-portal rounded-r-portal flex gap-3 border-l-4 p-4 no-underline hover:no-underline"
    >
      <IconeArquivo tipo={a.tipo} className="text-azul mt-0.5 size-5 shrink-0" />

      <span className="flex-1">
        <span className="text-azul block text-sm font-bold">{a.titulo}</span>
        {a.descricao && <span className="mt-0.5 block text-[12.5px]">{a.descricao}</span>}

        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]">
          <span className="bg-cinza text-azul rounded px-1.5 py-0.5 font-bold">
            {ROTULO_TIPO[a.tipo]}
          </span>

          {a.prazo && (
            <span className="text-vermelho font-bold">
              <span aria-hidden="true">● </span>
              {a.prazo}
            </span>
          )}

          {a.exemplo && (
            <span className="opacity-70" title="Conteúdo ainda não conferido pela secretaria">
              exemplo
            </span>
          )}
        </span>
      </span>
    </a>
  );
}
