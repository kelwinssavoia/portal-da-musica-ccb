"use client";

import { Marcar, Texto } from "@/components/admin/campos";
import { FormExcluir, FormRegistro } from "@/components/admin/form-registro";
import { excluirCidade, salvarCidade } from "@/app/admin/(painel)/congregacoes/acoes";
import type { Cidade } from "@/lib/tipos-banco";

export function FormCidade({ cidade: c }: { cidade?: Cidade }) {
  const editando = Boolean(c);

  return (
    <FormRegistro
      acao={salvarCidade}
      rotuloSalvar={editando ? "Salvar" : "Adicionar cidade"}
      aoLado={
        editando ? (
          <FormExcluir
            acao={excluirCidade}
            id={c!.id}
            rotulo="Excluir cidade"
            pergunta="Excluir esta cidade?"
          />
        ) : undefined
      }
    >
      {editando && <input type="hidden" name="id" value={c!.id} />}

      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <Texto nome="nome" rotulo="Cidade" obrigatorio valor={c?.nome} />
        <Texto
          nome="uf"
          rotulo="UF"
          valor={c?.uf}
          maxLength={2}
          ajuda="Opcional."
        />
      </div>

      <Marcar nome="ativo" rotulo="Ativa" valor={c ? c.ativo : true} />
    </FormRegistro>
  );
}
