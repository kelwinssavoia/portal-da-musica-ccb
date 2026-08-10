"use server";

import { z } from "zod";

import {
  acao,
  inteiro,
  marcado,
  paraSlug,
  textoObrigatorio,
  textoOpcional,
  type Resultado,
} from "@/lib/acoes";
import { LIMITE_ARQUIVO, apagarArquivo, extensaoDe, subirArquivo, temArquivo } from "@/lib/upload";
import type { Database } from "@/lib/tipos-banco";

type RegistroArquivo = Database["public"]["Tables"]["arquivos"]["Insert"];

const TIPOS = ["pdf", "planilha", "documento", "formulario", "pasta", "video", "link"] as const;

const esquema = z.object({
  id: textoOpcional,
  categoria_id: textoObrigatorio("Categoria"),
  titulo: textoObrigatorio("Título"),
  descricao: textoOpcional,
  tipo: z.enum(TIPOS),
  url: textoOpcional,
  prazo: textoOpcional,
  exemplo: marcado,
  ordem: inteiro,
  ativo: marcado,
});

export async function salvarArquivo(_: unknown, dados: FormData): Promise<Resultado> {
  const enviado = dados.get("arquivo");

  return acao("arquivos", esquema, dados, async (v, supabase) => {
    const novoArquivo = temArquivo(enviado);

    if (!v.id && !novoArquivo && !v.url) {
      throw new Error("Envie o arquivo ou informe um link para ele.");
    }

    const atual = v.id
      ? (
          await supabase
            .from("arquivos")
            .select("arquivo_path, versao, origem")
            .eq("id", v.id)
            .maybeSingle()
        ).data
      : null;

    const base = {
      categoria_id: v.categoria_id,
      titulo: v.titulo,
      descricao: v.descricao,
      tipo: v.tipo,
      prazo: v.prazo,
      exemplo: v.exemplo,
      ordem: v.ordem,
      ativo: v.ativo,
    };

    let registro: RegistroArquivo = base;
    let caminhoAntigoParaApagar: string | null = null;

    if (novoArquivo) {
      const arquivo = enviado as File;
      const ext = extensaoDe(arquivo);

      // Aqui está a promessa de "o link nunca muda": um arquivo que já existe
      // mantém o MESMO caminho na substituição, mesmo que o título mude. Só
      // troca de caminho se a extensão mudar — não dá para servir um .xlsx num
      // endereço .pdf. Quem avisa o CDN que o conteúdo mudou é a versão.
      const manterCaminho =
        atual?.arquivo_path && atual.arquivo_path.endsWith(`.${ext}`) ? atual.arquivo_path : null;

      const { data: categoria } = await supabase
        .from("arquivo_categorias")
        .select("nome")
        .eq("id", v.categoria_id)
        .maybeSingle();

      const caminho =
        manterCaminho ?? `${paraSlug(categoria?.nome ?? "arquivos")}/${paraSlug(v.titulo)}.${ext}`;

      await subirArquivo(supabase, "arquivos", caminho, arquivo, LIMITE_ARQUIVO);

      if (atual?.arquivo_path && atual.arquivo_path !== caminho) {
        caminhoAntigoParaApagar = atual.arquivo_path;
      }

      registro = {
        ...base,
        origem: "upload",
        arquivo_path: caminho,
        arquivo_nome: arquivo.name,
        tamanho_bytes: arquivo.size,
        url: null,
        versao: (atual?.versao ?? 0) + 1,
      };
    } else if (v.url) {
      registro = {
        ...base,
        origem: "link",
        url: v.url,
        arquivo_path: null,
        arquivo_nome: null,
        tamanho_bytes: null,
      };
      if (atual?.arquivo_path) caminhoAntigoParaApagar = atual.arquivo_path;
    }

    const { error } = v.id
      ? await supabase.from("arquivos").update(registro).eq("id", v.id)
      : await supabase.from("arquivos").insert(registro);

    if (error) throw error;

    await apagarArquivo(supabase, "arquivos", caminhoAntigoParaApagar);

    if (novoArquivo && atual?.arquivo_path && !caminhoAntigoParaApagar) {
      return "Arquivo substituído. O endereço continua o mesmo — quem já tinha o link recebe a versão nova.";
    }
  });
}

export async function excluirArquivo(_: unknown, dados: FormData): Promise<Resultado> {
  return acao(
    "arquivos",
    z.object({ id: textoObrigatorio("Registro") }),
    dados,
    async (v, supabase) => {
      const { data } = await supabase
        .from("arquivos")
        .select("arquivo_path")
        .eq("id", v.id)
        .maybeSingle();

      const { error } = await supabase.from("arquivos").delete().eq("id", v.id);
      if (error) throw error;

      await apagarArquivo(supabase, "arquivos", data?.arquivo_path ?? null);
    },
  );
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

const esquemaCategoria = z.object({
  id: textoOpcional,
  nome: textoObrigatorio("Nome"),
  descricao: textoOpcional,
  ordem: inteiro,
  ativo: marcado,
});

export async function salvarCategoria(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("arquivos", esquemaCategoria, dados, async (v, supabase) => {
    const registro = { nome: v.nome, descricao: v.descricao, ordem: v.ordem, ativo: v.ativo };

    const { error } = v.id
      ? await supabase.from("arquivo_categorias").update(registro).eq("id", v.id)
      : await supabase.from("arquivo_categorias").insert(registro);

    if (error) throw error;
  });
}

export async function excluirCategoria(_: unknown, dados: FormData): Promise<Resultado> {
  return acao(
    "arquivos",
    z.object({ id: textoObrigatorio("Registro") }),
    dados,
    async (v, supabase) => {
      const { count } = await supabase
        .from("arquivos")
        .select("*", { count: "exact", head: true })
        .eq("categoria_id", v.id);

      if ((count ?? 0) > 0) {
        throw new Error(
          `Esta categoria tem ${count} arquivo(s). Mova ou exclua os arquivos antes de excluí-la.`,
        );
      }

      const { error } = await supabase.from("arquivo_categorias").delete().eq("id", v.id);
      if (error) throw error;
    },
  );
}
