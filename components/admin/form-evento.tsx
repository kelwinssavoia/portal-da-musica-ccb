"use client";

import { AreaTexto, Marcar, Selecao, Texto } from "@/components/admin/campos";
import { FormExcluir, FormRegistro } from "@/components/admin/form-registro";
import {
  excluirEvento,
  excluirExcecao,
  salvarEvento,
  salvarExcecao,
} from "@/app/admin/(painel)/eventos/acoes";
import type { Congregacao, EnsaioExcecao, EventoRow, TipoEvento } from "@/lib/tipos-banco";

function paraInput(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : "";
}

export function FormEvento({
  evento: e,
  tipos,
  congregacoes,
}: {
  evento?: EventoRow;
  tipos: TipoEvento[];
  congregacoes: Congregacao[];
}) {
  const editando = Boolean(e);

  // Ensaio local sai da lista: ele vem do padrão da comum, não daqui.
  const opcoesTipo = tipos
    .filter((t) => t.id !== "local")
    .map((t) => ({ valor: t.id, nome: t.label }));

  return (
    <FormRegistro
      acao={salvarEvento}
      rotuloSalvar={editando ? "Salvar alterações" : "Agendar evento"}
      aoLado={editando ? <FormExcluir acao={excluirEvento} id={e!.id} /> : undefined}
    >
      {editando && <input type="hidden" name="id" value={e!.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao
          nome="tipo_id"
          rotulo="Tipo"
          obrigatorio
          vazio={null}
          opcoes={opcoesTipo}
          valor={e?.tipo_id}
        />
        <Texto nome="titulo" rotulo="Título" obrigatorio valor={e?.titulo} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Texto nome="data" rotulo="Data" tipo="date" obrigatorio valor={e?.data} />
        <Texto nome="hora" rotulo="Hora" tipo="time" valor={paraInput(e?.hora)} />
        <Selecao
          nome="congregacao_id"
          rotulo="Onde acontece"
          opcoes={congregacoes.map((c) => ({ valor: c.id, nome: c.nome }))}
          valor={e?.congregacao_id}
          ajuda="Todo evento acontece numa comum."
        />
      </div>

      <AreaTexto nome="descricao" rotulo="Observação" valor={e?.descricao} linhas={2} />

      <Marcar nome="ativo" rotulo="Aparece no portal" valor={e ? e.ativo : true} />
    </FormRegistro>
  );
}

export function FormExcecao({
  congregacoes,
  excecao,
}: {
  congregacoes: Congregacao[];
  excecao?: EnsaioExcecao;
}) {
  const comEnsaio = congregacoes.filter((c) => c.ensaio_ord !== null && c.ensaio_dow !== null);

  return (
    <FormRegistro
      acao={salvarExcecao}
      rotuloSalvar={excecao ? "Salvar exceção" : "Registrar exceção"}
      aoLado={
        excecao ? (
          <FormExcluir
            acao={excluirExcecao}
            id={excecao.id}
            rotulo="Remover exceção"
            pergunta="Remover a exceção? O ensaio volta para a data normal."
          />
        ) : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao
          nome="congregacao_id"
          rotulo="Comum"
          obrigatorio
          vazio={null}
          opcoes={comEnsaio.map((c) => ({ valor: c.id, nome: c.nome }))}
          valor={excecao?.congregacao_id}
        />
        <Texto
          nome="data_original"
          rotulo="Data do ensaio que muda"
          tipo="date"
          obrigatorio
          valor={excecao?.data_original}
          ajuda="A data que o padrão geraria."
        />
      </div>

      <Marcar
        nome="cancelado"
        rotulo="Cancelado (não acontece nessa data)"
        valor={excecao?.cancelado}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Texto
          nome="nova_data"
          rotulo="Nova data"
          tipo="date"
          valor={excecao?.nova_data}
          ajuda="Preencha só se foi remanejado."
        />
        <Texto nome="nova_hora" rotulo="Nova hora" tipo="time" valor={paraInput(excecao?.nova_hora)} />
      </div>

      <Texto nome="motivo" rotulo="Motivo" valor={excecao?.motivo} />
    </FormRegistro>
  );
}
