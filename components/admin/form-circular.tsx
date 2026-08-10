"use client";

import { AreaTexto, Marcar, Texto } from "@/components/admin/campos";
import { CampoUpload } from "@/components/admin/campo-upload";
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

      <CampoUpload
        nome="arquivo"
        rotulo="PDF da circular"
        bucket="circulares"
        aceita="application/pdf"
        limiteMb={25}
        caminhoAtual={c?.origem === "upload" ? c.arquivo_path : null}
        nomeAtual={c?.arquivo_nome}
        ajuda="Até 25 MB. O portal hospeda o arquivo — não precisa do Drive."
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
