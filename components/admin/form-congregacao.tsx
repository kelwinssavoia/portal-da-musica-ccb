"use client";

import { AreaTexto, Marcar, Selecao, Texto } from "@/components/admin/campos";
import { CampoHora, horaParaInput } from "@/components/admin/campo-data";
import { CampoUpload } from "@/components/admin/campo-upload";
import { FormExcluir, FormRegistro } from "@/components/admin/form-registro";
import {
  excluirCongregacao,
  removerFoto,
  salvarCongregacao,
} from "@/app/admin/(painel)/congregacoes/acoes";
import { DIAS, MESES_CURTO, ORDINAIS } from "@/lib/datas";
import type { ComumComCultos } from "@/lib/dados/congregacoes";
import { nomeDaCidade } from "@/lib/cidades";
import type { Cidade } from "@/lib/tipos-banco";

const OPCOES_DIA = DIAS.map((nome, i) => ({ valor: i, nome }));
const OPCOES_ORDINAL = [1, 2, 3, 4, 5].map((o) => ({ valor: o, nome: ORDINAIS[o] }));

export function FormCongregacao({
  congregacao: c,
  cidades,
}: {
  congregacao?: ComumComCultos;
  cidades: Cidade[];
}) {
  const editando = Boolean(c);
  // `null` no banco significa "todo mês"; no formulário isso é tudo marcado.
  const mesesMarcados = c?.ensaio_meses ?? null;

  return (
    <FormRegistro
      acao={salvarCongregacao}
      rotuloSalvar={editando ? "Salvar alterações" : "Cadastrar comum"}
      aoLado={editando ? <FormExcluir acao={excluirCongregacao} id={c!.id} /> : undefined}
    >
      {editando && <input type="hidden" name="id" value={c!.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Texto nome="nome" rotulo="Nome da comum" obrigatorio valor={c?.nome} />
        <Texto
          nome="slug"
          rotulo="Endereço da página"
          ajuda={
            editando
              ? "Mudar isso quebra links já compartilhados desta comum."
              : "Deixe em branco para gerar pelo nome."
          }
          valor={c?.slug}
        />
      </div>

      <Selecao
        nome="cidade_id"
        rotulo="Cidade"
        // Só é obrigatório depois que existe cidade cadastrada — numa instalação
        // nova, a secretaria cadastra as comuns antes das cidades.
        obrigatorio={cidades.length > 0}
        vazio={cidades.length > 0 ? "Selecione a cidade" : "Nenhuma cidade cadastrada ainda"}
        opcoes={cidades.map((cid) => ({ valor: cid.id, nome: nomeDaCidade(cid) }))}
        valor={c?.cidade_id}
        ajuda={
          cidades.length === 0
            ? "Cadastre as cidades da regional na tela de Congregações."
            : undefined
        }
      />

      <AreaTexto nome="endereco" rotulo="Endereço" valor={c?.endereco} linhas={2} />

      <Texto
        nome="maps_url"
        rotulo="Link do mapa"
        tipo="url"
        ajuda="Opcional. Em branco, o portal monta a busca pelo endereço acima."
        valor={c?.maps_url}
      />

      <fieldset className="border-cinza rounded-portal border p-4">
        <legend className="text-azul px-1 text-[12.5px] font-bold">Cultos oficiais</legend>
        <p className="mb-3 text-[12px] opacity-75">
          Marque os dias em que a comum tem culto e informe a hora de cada um.
        </p>

        <div className="flex flex-col gap-2">
          {DIAS.map((nome, dow) => {
            const culto = c?.cultos.find((k) => k.dow === dow);

            return (
              <div key={dow} className="flex flex-wrap items-center gap-3">
                <label className="flex min-w-[150px] items-center gap-2 text-[12.5px]">
                  <input
                    type="checkbox"
                    name={`culto_dia_${dow}`}
                    value="sim"
                    defaultChecked={Boolean(culto)}
                    className="size-4"
                  />
                  {nome}
                </label>

                <CampoHora
                  nome={`culto_hora_${dow}`}
                  rotulo={`Hora do culto de ${nome}`}
                  rotuloOculto
                  valor={horaParaInput(culto?.hora)}
                  className="w-[130px]"
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-cinza rounded-portal border p-4">
        <legend className="text-azul px-1 text-[12.5px] font-bold">Ensaio local</legend>
        <p className="mb-3 text-[12px] opacity-75">
          O ensaio acontece num dia fixo do mês. Ex.: 3º Domingo. As datas do calendário são
          geradas daqui — confira antes de salvar.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Selecao
            nome="ensaio_ord"
            rotulo="Qual do mês"
            opcoes={OPCOES_ORDINAL}
            valor={c?.ensaio_ord}
          />
          <Selecao
            nome="ensaio_dow"
            rotulo="Dia da semana"
            opcoes={OPCOES_DIA}
            valor={c?.ensaio_dow}
          />
          <CampoHora nome="ensaio_hora" rotulo="Hora" valor={horaParaInput(c?.ensaio_hora)} />
        </div>

        <div className="mt-4">
          <p className="text-azul text-[12.5px] font-bold">Em quais meses acontece</p>
          <p className="text-[11.5px] opacity-70">
            Marque todos (ou nenhum) para ensaio de todo mês. Para trimestral, marque só os quatro.
          </p>

          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {MESES_CURTO.map((nome, i) => {
              const mes = i + 1;
              return (
                <label key={mes} className="flex items-center gap-1.5 text-[12px]">
                  <input
                    type="checkbox"
                    name={`mes_${mes}`}
                    value="sim"
                    defaultChecked={mesesMarcados === null ? true : mesesMarcados.includes(mes)}
                    className="size-4"
                  />
                  {nome}
                </label>
              );
            })}
          </div>
        </div>
      </fieldset>

      <AreaTexto
        nome="observacoes"
        rotulo="Observações"
        ajuda="Aparece no detalhe da comum. Nada de dado pessoal."
        valor={c?.observacoes}
        linhas={2}
      />

      {/* Sem campo de ordem: a lista do portal é alfabética. */}
      <CampoUpload
        nome="foto"
        rotulo="Foto da comum"
        bucket="congregacoes"
        aceita="image/*"
        limiteMb={5}
        imagem
        caminhoAtual={c?.foto_path}
        ajuda="A foto é reduzida no seu aparelho antes de subir, então foto de celular serve."
      />

      <Marcar
        nome="ativo"
        rotulo="Aparece no portal"
        ajuda="Desmarque para esconder sem apagar."
        valor={c ? c.ativo : true}
      />

      {editando && c!.foto_path && (
        <div className="border-cinza rounded-portal flex items-center justify-between gap-3 border p-3">
          <span className="text-[12px]">Já existe uma foto cadastrada.</span>
          <FormExcluir
            acao={removerFoto}
            id={c!.id}
            rotulo="Remover foto"
            pergunta="Remover a foto desta comum?"
          />
        </div>
      )}
    </FormRegistro>
  );
}
