"use client";

import { AreaTexto, Arquivo, Marcar, Texto } from "@/components/admin/campos";
import { FormExcluir, FormRegistro } from "@/components/admin/form-registro";
import { excluirCircular, salvarCircular } from "@/app/admin/(painel)/circulares/acoes";
import type { Circular } from "@/lib/tipos-banco";

export function FormCircular({ circular: c }: { circular?: Circular }) {
  const editando = Boolean(c);

  return (
    <FormRegistro
      acao={salvarCircular}
      rotuloSalvar={editando ? "Salvar alterações" : "Publicar circular"}
      aoLado={editando ? <FormExcluir acao={excluirCircular} id={c!.id} /> : undefined}
    >
      {editando && <input type="hidden" name="id" value={c!.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Texto
          nome="numero"
          rotulo="Número"
          obrigatorio
          valor={c?.numero}
          ajuda="Ex.: Circular 08/2026"
        />
        <Texto nome="data" rotulo="Data" tipo="date" obrigatorio valor={c?.data} />
      </div>

      <Texto nome="titulo" rotulo="Título" obrigatorio valor={c?.titulo} />
      <AreaTexto nome="resumo" rotulo="Resumo" valor={c?.resumo} linhas={3} />

      <Arquivo
        nome="arquivo"
        rotulo="PDF da circular"
        aceita="application/pdf"
        ajuda={
          c?.origem === "upload"
            ? `Já existe um PDF (${c.arquivo_nome ?? "arquivo"}). Enviar outro substitui, mantendo o mesmo endereço.`
            : "Até 25 MB. O portal hospeda o arquivo — não precisa do Drive."
        }
      />

      <Texto
        nome="url"
        rotulo="Ou link externo"
        tipo="url"
        valor={c?.origem === "link" ? c.url : ""}
        ajuda="Use só quando a circular não for um arquivo para baixar."
      />

      <Marcar nome="publicado" rotulo="Publicada no portal" valor={c ? c.publicado : true} />
    </FormRegistro>
  );
}
