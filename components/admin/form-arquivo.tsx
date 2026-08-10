"use client";

import { AreaTexto, Arquivo, Marcar, Selecao, Texto } from "@/components/admin/campos";
import { FormExcluir, FormRegistro } from "@/components/admin/form-registro";
import {
  excluirArquivo,
  excluirCategoria,
  salvarArquivo,
  salvarCategoria,
} from "@/app/admin/(painel)/arquivos/acoes";
import type { Arquivo as ArquivoRow, ArquivoCategoria } from "@/lib/tipos-banco";

const TIPOS = [
  { valor: "pdf", nome: "PDF" },
  { valor: "planilha", nome: "Planilha" },
  { valor: "documento", nome: "Documento" },
  { valor: "formulario", nome: "Formulário" },
  { valor: "pasta", nome: "Pasta" },
  { valor: "video", nome: "Vídeo" },
  { valor: "link", nome: "Link" },
];

export function FormArquivo({
  arquivo: a,
  categorias,
}: {
  arquivo?: ArquivoRow;
  categorias: ArquivoCategoria[];
}) {
  const editando = Boolean(a);

  return (
    <FormRegistro
      acao={salvarArquivo}
      rotuloSalvar={editando ? "Salvar alterações" : "Adicionar arquivo"}
      aoLado={editando ? <FormExcluir acao={excluirArquivo} id={a!.id} /> : undefined}
    >
      {editando && <input type="hidden" name="id" value={a!.id} />}

      <Selecao
        nome="categoria_id"
        rotulo="Categoria"
        obrigatorio
        vazio={null}
        opcoes={categorias.map((c) => ({ valor: c.id, nome: c.nome }))}
        valor={a?.categoria_id}
      />

      <Texto nome="titulo" rotulo="Título" obrigatorio valor={a?.titulo} />
      <AreaTexto nome="descricao" rotulo="Descrição" valor={a?.descricao} linhas={2} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao nome="tipo" rotulo="Tipo" obrigatorio vazio={null} opcoes={TIPOS} valor={a?.tipo ?? "pdf"} />
        <Texto
          nome="prazo"
          rotulo="Prazo"
          valor={a?.prazo}
          ajuda="Texto curto. Aparece em vermelho no card."
        />
      </div>

      <Arquivo
        nome="arquivo"
        rotulo="Arquivo"
        aceita="application/pdf,image/jpeg,image/png,.xlsx,.docx"
        ajuda={
          a?.origem === "upload"
            ? `Versão ${a.versao} no portal (${a.arquivo_nome ?? "arquivo"}). Enviar outro substitui mantendo o mesmo endereço — quem já tem o link recebe a versão nova.`
            : "Até 25 MB. O portal hospeda o arquivo; não precisa do Drive."
        }
      />

      <Texto
        nome="url"
        rotulo="Ou link externo"
        tipo="url"
        valor={a?.origem === "link" ? a.url : ""}
        ajuda="Use para pasta compartilhada, formulário ou vídeo — coisas que não são arquivo para baixar."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Texto nome="ordem" rotulo="Ordem" tipo="number" valor={a?.ordem ?? 0} />
        <div className="flex flex-col gap-2">
          <Marcar nome="ativo" rotulo="Aparece no portal" valor={a ? a.ativo : true} />
          <Marcar
            nome="exemplo"
            rotulo="Marcar como exemplo"
            valor={a ? a.exemplo : false}
            ajuda="Conteúdo ainda não conferido pela secretaria."
          />
        </div>
      </div>
    </FormRegistro>
  );
}

export function FormCategoria({ categoria: c }: { categoria?: ArquivoCategoria }) {
  const editando = Boolean(c);

  return (
    <FormRegistro
      acao={salvarCategoria}
      rotuloSalvar={editando ? "Salvar" : "Adicionar categoria"}
      aoLado={
        editando ? (
          <FormExcluir
            acao={excluirCategoria}
            id={c!.id}
            rotulo="Excluir categoria"
            pergunta="Excluir esta categoria?"
          />
        ) : undefined
      }
    >
      {editando && <input type="hidden" name="id" value={c!.id} />}

      <Texto nome="nome" rotulo="Nome" obrigatorio valor={c?.nome} />
      <AreaTexto nome="descricao" rotulo="Descrição" valor={c?.descricao} linhas={2} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Texto nome="ordem" rotulo="Ordem" tipo="number" valor={c?.ordem ?? 0} />
        <Marcar nome="ativo" rotulo="Aparece no portal" valor={c ? c.ativo : true} />
      </div>
    </FormRegistro>
  );
}
