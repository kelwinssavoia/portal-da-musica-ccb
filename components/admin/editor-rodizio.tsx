"use client";

import { useActionState, useMemo, useState } from "react";

import { Botao } from "@/components/admin/campos";
import { salvarRodizio } from "@/app/admin/(painel)/rodizios/acoes";
import type { Resultado } from "@/lib/acoes";
import { DIAS, DIAS_CURTO, cultosEmTexto, dataNumerica, formatarHora } from "@/lib/datas";
import {
  contarPorOrganista,
  cultosDoPeriodo,
  diaDaSemana,
  gerarEscala,
  linhasComRestricao,
  periodoValido,
  podeTocar,
  type CultoSemanal,
  type LinhaEscala,
  type Participante,
} from "@/lib/rodizio";
import type { Organista, RodizioEscala, RodizioOrganista } from "@/lib/tipos-banco";

export type ComumDoRodizio = { id: string; nome: string; cultos: CultoSemanal[] };

export type RodizioSalvo = {
  id: string;
  congregacao_id: string;
  inicio: string;
  fim: string;
  observacoes: string | null;
  participantes: RodizioOrganista[];
  escala: RodizioEscala[];
};

/** Organista como o editor trabalha: com as restrições deste rodízio. */
type Linha = {
  chave: string;
  id: string | null;
  nome: string;
  participa: boolean;
  dows: number[];
  datas: string[];
};

const estiloCampo =
  "border-cinza rounded-portal text-azul w-full border bg-white px-3 py-2 text-[13px]";

function Secao({
  numero,
  titulo,
  ajuda,
  children,
}: {
  numero: number;
  titulo: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-superficie shadow-portal rounded-portal p-5">
      <h2 className="flex items-center gap-2 text-[15px]">
        <span className="bg-azul flex size-6 items-center justify-center rounded-full text-[12px] text-white">
          {numero}
        </span>
        {titulo}
      </h2>
      {ajuda && <p className="mt-1 text-[12.5px]">{ajuda}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Rótulo do culto numa linha: `"Dom 02/11 · 18h30"`. */
function rotuloCulto(c: { data: string; hora: string | null }): string {
  const base = `${DIAS_CURTO[diaDaSemana(c.data)]} ${dataNumerica(c.data)}`;
  return c.hora ? `${base} · ${formatarHora(c.hora)}` : base;
}

/**
 * Lista de organistas para a comum escolhida.
 *
 * Rodízio novo: todas as ativas, com a restrição padrão de cada uma. Editando:
 * quem participou com a restrição gravada naquele rodízio, e as demais ativas
 * desmarcadas — para dar para incluir alguém que entrou depois.
 */
function listaInicial(organistas: Organista[], comumId: string, salvo?: RodizioSalvo): Linha[] {
  const participantes = new Map((salvo?.participantes ?? []).map((p) => [p.organista_id, p]));

  return organistas
    .filter((o) => o.congregacao_id === comumId && (o.ativo || participantes.has(o.id)))
    .map((o) => {
      const p = participantes.get(o.id);
      return {
        chave: o.id,
        id: o.id,
        nome: o.nome,
        participa: salvo ? Boolean(p) : true,
        dows: p ? p.dows_indisponiveis : o.dows_indisponiveis,
        datas: p ? p.datas_indisponiveis : [],
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function EditorRodizio({
  comuns,
  organistas,
  rodizio,
  periodoSugerido,
}: {
  comuns: ComumDoRodizio[];
  organistas: Organista[];
  rodizio?: RodizioSalvo;
  periodoSugerido: { inicio: string; fim: string };
}) {
  const editando = Boolean(rodizio);

  const [comumId, setComumId] = useState(rodizio?.congregacao_id ?? "");
  const [inicio, setInicio] = useState(rodizio?.inicio ?? periodoSugerido.inicio);
  const [fim, setFim] = useState(rodizio?.fim ?? periodoSugerido.fim);
  const [observacoes, setObservacoes] = useState(rodizio?.observacoes ?? "");
  const [lista, setLista] = useState<Linha[]>(() =>
    rodizio ? listaInicial(organistas, rodizio.congregacao_id, rodizio) : [],
  );
  const [fixos, setFixos] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (rodizio?.escala ?? [])
        .filter((e) => e.fixo && e.organista_id)
        .map((e) => [e.data, e.organista_id!]),
    ),
  );
  const [linhas, setLinhas] = useState<LinhaEscala[] | null>(() =>
    rodizio
      ? rodizio.escala.map((e) => ({
          data: e.data,
          dow: diaDaSemana(e.data),
          hora: e.hora,
          organista: e.organista_id,
          fixo: e.fixo,
        }))
      : null,
  );
  const [desatualizado, setDesatualizado] = useState(false);
  const [novaNome, setNovaNome] = useState("");
  const [contadorNovas, setContadorNovas] = useState(0);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [extra, setExtra] = useState({ data: "", hora: "" });

  const [estado, enviar, pendente] = useActionState<Resultado | null, FormData>(
    salvarRodizio,
    null,
  );

  const comum = comuns.find((c) => c.id === comumId);
  const periodoOk = periodoValido(inicio, fim);
  const cultos = useMemo(
    () => (comum && periodoOk ? cultosDoPeriodo(comum.cultos, inicio, fim) : []),
    [comum, periodoOk, inicio, fim],
  );
  const diasDeCulto = [...new Set((comum?.cultos ?? []).map((c) => c.dow))].sort();

  const participantes: Participante[] = lista
    .filter((o) => o.participa)
    .map((o) => ({ chave: o.chave, dowsIndisponiveis: o.dows, datasIndisponiveis: o.datas }));
  const nomes = new Map(lista.map((o) => [o.chave, o.nome]));
  const porChave = new Map(participantes.map((p) => [p.chave, p]));

  /** Toda mudança de configuração depois de gerar avisa que a escala ficou para trás. */
  function mudouConfig() {
    if (linhas) setDesatualizado(true);
  }

  function trocarComum(id: string) {
    setComumId(id);
    setLista(listaInicial(organistas, id));
    setFixos({});
    setLinhas(null);
    setDesatualizado(false);
  }

  function alterar(chave: string, mudanca: Partial<Linha>) {
    setLista((l) => l.map((o) => (o.chave === chave ? { ...o, ...mudanca } : o)));
    mudouConfig();
  }

  function adicionarOrganista() {
    const nome = novaNome.trim().replace(/\s+/g, " ");
    if (!nome) return;
    if (lista.some((o) => o.nome.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"))) {
      setErroLocal(`${nome} já está na lista.`);
      return;
    }
    const chave = `nova-${contadorNovas}`;
    setContadorNovas((n) => n + 1);
    setLista((l) => [...l, { chave, id: null, nome, participa: true, dows: [], datas: [] }]);
    setNovaNome("");
    setErroLocal(null);
    mudouConfig();
  }

  function removerNova(chave: string) {
    setLista((l) => l.filter((o) => o.chave !== chave));
    setFixos((f) => Object.fromEntries(Object.entries(f).filter(([, k]) => k !== chave)));
    mudouConfig();
  }

  function marcarFixo(data: string, chave: string | null) {
    setFixos((f) => {
      const novo = { ...f };
      if (chave) novo[data] = chave;
      else delete novo[data];
      return novo;
    });
  }

  /** Fixa (ou solta) uma organista numa data. Já aplica na escala gerada. */
  function fixar(data: string, chave: string | null) {
    marcarFixo(data, chave);
    if (linhas && chave) {
      setLinhas(linhas.map((l) => (l.data === data ? { ...l, organista: chave } : l)));
    }
  }

  function gerar() {
    if (
      linhas &&
      !confirm("Gerar de novo substitui a escala atual. As datas fixadas continuam. Gerar?")
    ) {
      return;
    }
    const validos = Object.fromEntries(
      Object.entries(fixos).filter(([d, k]) => porChave.has(k) && cultos.some((c) => c.data === d)),
    );
    setLinhas(gerarEscala(cultos, participantes, validos));
    setDesatualizado(false);
    setErroLocal(null);
  }

  function trocarNaLinha(data: string, chave: string | null) {
    if (!linhas) return;
    setLinhas(linhas.map((l) => (l.data === data ? { ...l, organista: chave } : l)));
    if (fixos[data]) marcarFixo(data, chave);
  }

  function removerLinha(data: string) {
    if (!linhas) return;
    setLinhas(linhas.filter((l) => l.data !== data));
    marcarFixo(data, null);
  }

  function adicionarLinha() {
    if (!linhas || !extra.data) return;
    if (linhas.some((l) => l.data === extra.data)) {
      setErroLocal("Já existe culto nessa data na escala.");
      return;
    }
    const nova: LinhaEscala = {
      data: extra.data,
      dow: diaDaSemana(extra.data),
      hora: extra.hora ? `${extra.hora}:00` : null,
      organista: null,
      fixo: false,
    };
    setLinhas([...linhas, nova].sort((a, b) => a.data.localeCompare(b.data)));
    setExtra({ data: "", hora: "" });
    setErroLocal(null);
  }

  /** Confere o que o servidor também confere, para dar a mensagem antes de enviar. */
  function payload(): { erro: string } | { json: string } {
    if (!comum) return { erro: "Escolha a comum." };
    if (!periodoOk) {
      return { erro: "Período inválido: o fim vem depois do início, e no máximo um ano." };
    }
    if (participantes.length === 0) return { erro: "Inclua ao menos uma organista." };
    if (!linhas || linhas.length === 0) return { erro: "Gere o rodízio antes de salvar." };

    const fora = linhas.find((l) => l.data < inicio || l.data > fim);
    if (fora) {
      return {
        erro: `O culto de ${dataNumerica(fora.data)} está fora do período. Tire-o da escala ou ajuste o período.`,
      };
    }

    const ausente = linhas.find((l) => l.organista && !porChave.has(l.organista));
    if (ausente) {
      return {
        erro: `${nomes.get(ausente.organista!) ?? "Uma organista"} está na escala de ${dataNumerica(ausente.data)}, mas não participa. Troque a organista dessa data ou gere de novo.`,
      };
    }

    const json = JSON.stringify({
      id: rodizio?.id ?? null,
      congregacao_id: comum.id,
      inicio,
      fim,
      observacoes: observacoes.trim() || null,
      organistas: lista
        .filter((o) => o.participa)
        .map((o) => ({
          chave: o.chave,
          id: o.id,
          nome: o.nome,
          dows_indisponiveis: o.dows,
          datas_indisponiveis: o.datas.filter((d) => d >= inicio && d <= fim),
        })),
      escala: linhas.map((l) => ({
        data: l.data,
        hora: l.hora,
        organista: l.organista,
        fixo: l.organista !== null && fixos[l.data] === l.organista,
      })),
    });
    return { json };
  }

  function aoEnviar(dados: FormData) {
    const p = payload();
    if ("erro" in p) {
      setErroLocal(p.erro);
      return;
    }
    setErroLocal(null);
    dados.set("payload", p.json);
    enviar(dados);
  }

  const contagem = linhas ? contarPorOrganista(linhas, participantes) : null;
  const comRestricao = linhas ? linhasComRestricao(linhas, participantes) : new Set<string>();
  const vagas = linhas?.filter((l) => l.organista === null).length ?? 0;
  const totalFixos = Object.keys(fixos).filter((d) => cultos.some((c) => c.data === d)).length;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Comum ------------------------------------------------------- */}
      <Secao numero={1} titulo="Congregação">
        <select
          aria-label="Congregação"
          value={comumId}
          disabled={editando}
          onChange={(e) => trocarComum(e.target.value)}
          className={estiloCampo}
        >
          <option value="">Escolha a comum…</option>
          {comuns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        {comum && (
          <p className="mt-2 text-[12.5px]">
            {comum.cultos.length > 0 ? (
              <>
                Cultos cadastrados: <strong className="text-azul">{cultosEmTexto(comum.cultos)}</strong>
              </>
            ) : (
              <span className="text-vermelho">
                Esta comum não tem cultos cadastrados. Cadastre em Congregações antes de gerar o
                rodízio.
              </span>
            )}
          </p>
        )}
      </Secao>

      {comum && (
        <>
          {/* 2. Período ------------------------------------------------- */}
          <Secao numero={2} titulo="Período">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-azul text-[12.5px] font-bold">Início</span>
                <input
                  type="date"
                  value={inicio}
                  onChange={(e) => {
                    setInicio(e.target.value);
                    mudouConfig();
                  }}
                  className={`${estiloCampo} mascara-cheia`}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-azul text-[12.5px] font-bold">Fim</span>
                <input
                  type="date"
                  value={fim}
                  min={inicio}
                  onChange={(e) => {
                    setFim(e.target.value);
                    mudouConfig();
                  }}
                  className={`${estiloCampo} mascara-cheia`}
                />
              </label>
            </div>
            <p className="mt-2 text-[12.5px]">
              {periodoOk ? (
                <>
                  <strong className="text-azul">{cultos.length} cultos</strong> no período
                  {participantes.length > 0 && cultos.length > 0 && (
                    <>
                      {" "}
                      — cerca de {(cultos.length / participantes.length).toFixed(1).replace(".", ",")}{" "}
                      por organista
                    </>
                  )}
                  .
                </>
              ) : (
                <span className="text-vermelho">
                  Período inválido: o fim vem depois do início, e no máximo um ano.
                </span>
              )}
            </p>
          </Secao>

          {/* 3. Organistas e restrições -------------------------------- */}
          <Secao
            numero={3}
            titulo="Organistas e restrições"
            ajuda="Marque quem participa e os dias em que cada uma não pode tocar. Os dias da semana ficam gravados e voltam como sugestão no próximo rodízio desta comum; as datas valem só para este."
          >
            {lista.length === 0 && (
              <p className="text-[12.5px]">Nenhuma organista cadastrada nesta comum ainda.</p>
            )}

            <ul className="flex flex-col">
              {lista.map((o) => (
                <li
                  key={o.chave}
                  className={`border-cinza flex flex-col gap-2 border-b py-3 last:border-b-0 ${
                    o.participa ? "" : "opacity-55"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex min-w-[200px] flex-1 items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={o.participa}
                        onChange={(e) => alterar(o.chave, { participa: e.target.checked })}
                      />
                      <span className="text-azul text-[13px] font-bold">{o.nome}</span>
                      {!o.id && <span className="text-verde text-[11px] font-bold">nova</span>}
                    </label>

                    {diasDeCulto.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11.5px]">Não pode:</span>
                        {diasDeCulto.map((d) => {
                          const marcado = o.dows.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              disabled={!o.participa}
                              aria-pressed={marcado}
                              title={`${o.nome} ${marcado ? "não pode" : "pode"} tocar ${DIAS[d].toLowerCase()}`}
                              onClick={() =>
                                alterar(o.chave, {
                                  dows: marcado ? o.dows.filter((x) => x !== d) : [...o.dows, d].sort(),
                                })
                              }
                              className={`rounded-portal border px-2 py-0.5 text-[11.5px] font-bold ${
                                marcado
                                  ? "border-vermelho bg-vermelho/10 text-vermelho line-through"
                                  : "border-cinza text-azul bg-white"
                              }`}
                            >
                              {DIAS_CURTO[d]}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!o.id && (
                      <button
                        type="button"
                        onClick={() => removerNova(o.chave)}
                        className="text-vermelho text-[12px] underline"
                      >
                        remover
                      </button>
                    )}
                  </div>

                  {o.participa && (
                    <div className="flex flex-wrap items-center gap-1.5 pl-6">
                      <span className="text-[11.5px]">Datas que não pode:</span>
                      {o.datas.map((d) => (
                        <span
                          key={d}
                          className="border-vermelho text-vermelho rounded-portal flex items-center gap-1 border px-2 py-0.5 text-[11.5px]"
                        >
                          {DIAS_CURTO[diaDaSemana(d)]} {dataNumerica(d)}
                          <button
                            type="button"
                            aria-label={`Tirar ${dataNumerica(d)}`}
                            onClick={() => alterar(o.chave, { datas: o.datas.filter((x) => x !== d) })}
                            className="font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <select
                        aria-label={`Adicionar data em que ${o.nome} não pode`}
                        value=""
                        onChange={(e) => {
                          const d = e.target.value;
                          if (d && !o.datas.includes(d)) {
                            alterar(o.chave, { datas: [...o.datas, d].sort() });
                          }
                        }}
                        className="border-cinza rounded-portal text-azul border bg-white py-0.5 pl-2 text-[11.5px]"
                      >
                        <option value="">+ data</option>
                        {cultos
                          .filter((c) => !o.datas.includes(c.data) && !o.dows.includes(c.dow))
                          .map((c) => (
                            <option key={c.data} value={c.data}>
                              {rotuloCulto(c)}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-azul text-[12.5px] font-bold">Nova organista</span>
                <input
                  type="text"
                  value={novaNome}
                  maxLength={80}
                  placeholder="Nome como ela é conhecida (ex.: Ana Paula)"
                  onChange={(e) => setNovaNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionarOrganista();
                    }
                  }}
                  className={estiloCampo}
                />
              </label>
              <Botao type="button" variante="secundario" onClick={adicionarOrganista}>
                Adicionar
              </Botao>
            </div>
          </Secao>

          {/* 4. Datas fixas ------------------------------------------------ */}
          <Secao
            numero={4}
            titulo="Datas definidas antes do sorteio"
            ajuda="Opcional. Se alguma irmã precisa tocar num culto específico, escolha aqui. O sorteio respeita e conta essa data no total dela."
          >
            {cultos.length === 0 ? (
              <p className="text-[12.5px]">Escolha um período com cultos.</p>
            ) : (
              <details open={totalFixos > 0}>
                <summary className="text-azul cursor-pointer text-[12.5px] font-bold">
                  {totalFixos > 0
                    ? `${totalFixos} ${totalFixos === 1 ? "data definida" : "datas definidas"}`
                    : "Definir organista para uma data"}
                </summary>
                <div className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                  {cultos.map((c) => (
                    <label key={c.data} className="flex items-center gap-2 text-[12.5px]">
                      <span className="text-azul w-[120px] shrink-0 font-bold">{rotuloCulto(c)}</span>
                      <select
                        value={fixos[c.data] ?? ""}
                        onChange={(e) => fixar(c.data, e.target.value || null)}
                        className="border-cinza rounded-portal text-azul w-full border bg-white py-1 pl-2 text-[12.5px]"
                      >
                        <option value="">sorteio</option>
                        {participantes.map((p) => (
                          <option key={p.chave} value={p.chave}>
                            {nomes.get(p.chave)}
                            {podeTocar(p, c) ? "" : " (tem restrição)"}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </details>
            )}
          </Secao>

          {/* 5. Escala ------------------------------------------------------ */}
          <Secao
            numero={5}
            titulo="Escala"
            ajuda="O sorteio distribui os cultos igualmente entre as organistas, respeitando as restrições. Depois de gerar, troque o que quiser à mão."
          >
            <Botao
              type="button"
              onClick={gerar}
              disabled={cultos.length === 0 || participantes.length === 0}
            >
              {linhas ? "Gerar de novo" : "Gerar rodízio"}
            </Botao>

            {desatualizado && (
              <p className="border-vermelho bg-vermelho/5 rounded-r-portal mt-3 border-l-4 p-3 text-[12.5px]">
                As configurações mudaram depois de gerar. Clique em <strong>Gerar de novo</strong>{" "}
                para aplicar — ou ajuste a escala abaixo à mão.
              </p>
            )}

            {linhas && contagem && (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...contagem.entries()]
                    .sort((a, b) =>
                      (nomes.get(a[0]) ?? "").localeCompare(nomes.get(b[0]) ?? "", "pt-BR"),
                    )
                    .map(([chave, n]) => (
                      <span
                        key={chave}
                        className="border-cinza rounded-portal border bg-white px-2.5 py-1 text-[12px]"
                      >
                        <strong className="text-azul">{nomes.get(chave)}</strong> · {n}{" "}
                        {n === 1 ? "vez" : "vezes"}
                      </span>
                    ))}
                  {vagas > 0 && (
                    <span className="border-vermelho text-vermelho rounded-portal border px-2.5 py-1 text-[12px] font-bold">
                      {vagas} {vagas === 1 ? "culto vago" : "cultos vagos"}
                    </span>
                  )}
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-[12.5px]">
                    <thead className="border-cinza text-azul border-b">
                      <tr>
                        <th className="py-2 pr-3">Culto</th>
                        <th className="py-2 pr-3">Organista</th>
                        <th className="py-2 pr-3" title="Fixada: gerar de novo não muda">
                          Fixa
                        </th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => {
                        const restrita = comRestricao.has(l.data);
                        return (
                          <tr key={l.data} className="border-cinza border-b last:border-b-0">
                            <td className="text-azul py-1.5 pr-3 font-bold whitespace-nowrap">
                              {rotuloCulto(l)}
                            </td>
                            <td className="py-1.5 pr-3">
                              <select
                                aria-label={`Organista de ${rotuloCulto(l)}`}
                                value={l.organista ?? ""}
                                onChange={(e) => trocarNaLinha(l.data, e.target.value || null)}
                                className={`rounded-portal w-full border bg-white py-1 pl-2 text-[12.5px] ${
                                  restrita || !l.organista
                                    ? "border-vermelho text-vermelho"
                                    : "border-cinza text-azul"
                                }`}
                              >
                                <option value="">— vago —</option>
                                {participantes.map((p) => (
                                  <option key={p.chave} value={p.chave}>
                                    {nomes.get(p.chave)}
                                    {podeTocar(p, l) ? "" : " (tem restrição)"}
                                  </option>
                                ))}
                              </select>
                              {restrita && (
                                <span className="text-vermelho text-[11px]">
                                  Ela marcou que não pode nesta data.
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 pr-3">
                              <input
                                type="checkbox"
                                className="size-4"
                                aria-label={`Fixar ${rotuloCulto(l)}`}
                                disabled={!l.organista}
                                checked={Boolean(l.organista) && fixos[l.data] === l.organista}
                                onChange={(e) => fixar(l.data, e.target.checked ? l.organista : null)}
                              />
                            </td>
                            <td className="py-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => removerLinha(l.data)}
                                className="text-vermelho text-[12px] underline"
                                title="Tirar este culto do rodízio"
                              >
                                tirar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-azul text-[12px] font-bold">Culto extra</span>
                    <input
                      type="date"
                      value={extra.data}
                      min={inicio}
                      max={fim}
                      onChange={(e) => setExtra({ ...extra, data: e.target.value })}
                      className={`${estiloCampo} ${extra.data ? "mascara-cheia" : "mascara-vazia"}`}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-azul text-[12px] font-bold">Hora</span>
                    <input
                      type="time"
                      value={extra.hora}
                      onChange={(e) => setExtra({ ...extra, hora: e.target.value })}
                      className={`${estiloCampo} ${extra.hora ? "mascara-cheia" : "mascara-vazia"}`}
                    />
                  </label>
                  <Botao
                    type="button"
                    variante="secundario"
                    onClick={adicionarLinha}
                    disabled={!extra.data}
                  >
                    Incluir na escala
                  </Botao>
                </div>
              </>
            )}
          </Secao>

          {/* Salvar ------------------------------------------------------- */}
          <form action={aoEnviar} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-azul text-[12.5px] font-bold">Observação (opcional)</span>
              <textarea
                rows={2}
                maxLength={500}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Aparece no link e na versão impressa. Ex.: em caso de falta, avise a encarregada."
                className={estiloCampo}
              />
            </label>

            {(erroLocal || (estado && !estado.ok)) && (
              <p className="border-vermelho bg-vermelho/5 rounded-r-portal border-l-4 p-3 text-[12.5px]">
                {erroLocal ?? (estado && !estado.ok ? estado.erro : "")}
              </p>
            )}

            <div>
              <Botao type="submit" disabled={pendente || !linhas}>
                {pendente ? "Salvando…" : editando ? "Salvar alterações" : "Salvar rodízio"}
              </Botao>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
