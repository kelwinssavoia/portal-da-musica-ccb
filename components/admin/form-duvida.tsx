"use client";

import { AreaTexto, Marcar, Texto } from "@/components/admin/campos";
import { FormExcluir, FormRegistro } from "@/components/admin/form-registro";
import { excluirDuvida, salvarDuvida } from "@/app/admin/(painel)/duvidas/acoes";
import type { Duvida } from "@/lib/tipos-banco";

export function FormDuvida({ duvida: d }: { duvida?: Duvida }) {
  const editando = Boolean(d);

  return (
    <FormRegistro
      acao={salvarDuvida}
      rotuloSalvar={editando ? "Salvar" : "Adicionar dúvida"}
      aoLado={editando ? <FormExcluir acao={excluirDuvida} id={d!.id} /> : undefined}
    >
      {editando && <input type="hidden" name="id" value={d!.id} />}

      <Texto nome="pergunta" rotulo="Pergunta" obrigatorio valor={d?.pergunta} />
      <AreaTexto
        nome="resposta"
        rotulo="Resposta"
        obrigatorio
        valor={d?.resposta}
        linhas={4}
        ajuda="Não invente regra ou prazo oficial da CCB. Se não tiver certeza, confirme antes."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Texto nome="ordem" rotulo="Ordem" tipo="number" valor={d?.ordem ?? 0} />
        <Marcar nome="ativo" rotulo="Aparece no portal" valor={d ? d.ativo : true} />
      </div>
    </FormRegistro>
  );
}
