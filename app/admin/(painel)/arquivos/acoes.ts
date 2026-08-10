"use server";

import { z } from "zod";

import {
  acao,
  inteiro,
  marcado,
  textoObrigatorio,
  textoOpcional,
  type Resultado,
} from "@/lib/acoes";
import { apagarArquivo } from "@/lib/upload";
import { caminhoValido } from "@/lib/slug";
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
  arquivo_path: textoOpcional,
  arquivo_nome: textoOpcional,
  arquivo_novo: textoOpcional,
});

export async function salvarArquivo(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("arquivos", esquema, dados, async (v, supabase) => {
    const novoArquivo = v.arquivo_novo === "sim" && Boolean(v.arquivo_path);
    if (novoArquivo && !caminhoValido(v.arquivo_path!)) {
      throw new Error("Caminho de arquivo inválido.");
    }

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
      // A promessa de "o link nunca muda" é cumprida no navegador: ele reaproveita
      // o caminho existente quando a extensão é a mesma. Aqui o servidor só
      // registra o caminho e incrementa a versão, que é o que avisa o CDN de que
      // o conteúdo daquele endereço mudou.
      const caminho = v.arquivo_path!;

      if (atual?.arquivo_path && atual.arquivo_path !== caminho) {
        caminhoAntigoParaApagar = atual.arquivo_path;
      }

      registro = {
        ...base,
        origem: "upload",
        arquivo_path: caminho,
        arquivo_nome: v.arquivo_nome,
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
  arquivo_path: textoOpcional,
  arquivo_nome: textoOpcional,
  arquivo_novo: textoOpcional,
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
