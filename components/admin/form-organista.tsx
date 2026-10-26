"use client";

import { Marcar, Texto } from "@/components/admin/campos";
import { FormExcluir, FormRegistro } from "@/components/admin/form-registro";
import { excluirOrganista, salvarOrganista } from "@/app/admin/(painel)/rodizios/acoes";
import type { Organista } from "@/lib/tipos-banco";

/** Manutenção de uma organista. O cadastro de quem é nova acontece no editor do rodízio. */
export function FormOrganista({ organista: o }: { organista: Organista }) {
  return (
    <FormRegistro
      acao={salvarOrganista}
      aoLado={
        <FormExcluir
          acao={excluirOrganista}
          id={o.id}
          pergunta={`Excluir ${o.nome}? Só é possível se ela não estiver em nenhum rodízio salvo.`}
        />
      }
    >
      <input type="hidden" name="id" value={o.id} />
      <Texto nome="nome" rotulo="Nome" obrigatorio valor={o.nome} maxLength={80} />
      <Marcar
        nome="ativo"
        rotulo="Participa dos rodízios"
        valor={o.ativo}
        ajuda="Desmarcada, ela não aparece nos próximos rodízios. Os já salvos continuam com ela."
      />
    </FormRegistro>
  );
}
