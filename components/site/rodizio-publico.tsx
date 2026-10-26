"use client";

import { useEffect, useState } from "react";

import { DIAS, MESES, dataNumerica, formatarHora, hojeISO, periodoEmTexto } from "@/lib/datas";
import { diaDaSemana } from "@/lib/rodizio";
import type { RodizioPublico as Dados } from "@/lib/tipos-banco";

/**
 * Chave por comum, não por rodízio: a irmã escolhe o nome uma vez e o link do
 * mês seguinte já abre com ela em destaque.
 */
function chaveLocal(comumId: string) {
  return `rodizio-organista:${comumId}`;
}

function lerEscolha(comumId: string): string | null {
  try {
    return localStorage.getItem(chaveLocal(comumId));
  } catch {
    return null;
  }
}

function gravarEscolha(comumId: string, organistaId: string | null) {
  try {
    if (organistaId) localStorage.setItem(chaveLocal(comumId), organistaId);
    else localStorage.removeItem(chaveLocal(comumId));
  } catch {
    // Navegação anônima ou armazenamento bloqueado: só não lembra da próxima vez.
  }
}

function porMes(escala: Dados["escala"]) {
  const grupos = new Map<string, Dados["escala"]>();
  for (const e of escala) {
    const chave = e.data.slice(0, 7);
    grupos.set(chave, [...(grupos.get(chave) ?? []), e]);
  }
  return [...grupos.entries()];
}

export function RodizioPublico({ rodizio }: { rodizio: Dados }) {
  const comumId = rodizio.congregacao.id;
  const nomes = new Map(rodizio.organistas.map((o) => [o.id, o.nome]));

  // Lido só depois de montar: o servidor não conhece o localStorage, e "hoje"
  // tem que ser o do aparelho no momento em que a irmã abre o link.
  const [pronto, setPronto] = useState(false);
  const [minha, setMinha] = useState<string | null>(null);
  const [soVer, setSoVer] = useState(false);
  const [hoje, setHoje] = useState("");

  useEffect(() => {
    const salva = lerEscolha(comumId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única do armazenamento local
    setMinha(salva && nomes.has(salva) ? salva : null);
    setHoje(hojeISO());
    setPronto(true);
    // `nomes` deriva de `rodizio`, que não muda nesta página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comumId]);

  function escolher(id: string | null) {
    setMinha(id);
    setSoVer(false);
    gravarEscolha(comumId, id);
  }

  const minhas = minha ? rodizio.escala.filter((e) => e.organista_id === minha) : [];
  const proxima = minhas.find((e) => e.data >= hoje);
  const perguntar = pronto && !minha && !soVer && rodizio.organistas.length > 0;

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5">
      <div>
        <p className="text-[12px] font-bold tracking-wide uppercase">Rodízio de organistas</p>
        <h1 className="text-xl">{rodizio.congregacao.nome}</h1>
        <p className="mt-1 text-[13px]">{periodoEmTexto(rodizio.inicio, rodizio.fim)}</p>
      </div>

      {perguntar && (
        <section className="bg-superficie border-azul shadow-portal rounded-r-portal border-l-4 p-5">
          <h2 className="text-[15px]">Quem é você?</h2>
          <p className="mt-1 text-[12.5px]">
            Escolha seu nome para ver suas datas em destaque. Este aparelho vai lembrar nas próximas
            vezes.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {rodizio.organistas.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => escolher(o.id)}
                className="border-azul text-azul rounded-portal hover:bg-azul border bg-white px-3 py-2.5 text-[13px] font-bold hover:text-white"
              >
                {o.nome}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSoVer(true)}
            className="mt-3 text-[12.5px] underline"
          >
            Só quero ver a escala
          </button>
        </section>
      )}

      {minha && (
        <section className="bg-azul rounded-portal shadow-portal p-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[12px] opacity-80">Suas datas</p>
              <h2 className="text-lg text-white">{nomes.get(minha)}</h2>
            </div>
            <button
              type="button"
              onClick={() => escolher(null)}
              className="text-[12px] text-white underline opacity-85"
            >
              Não é você? Trocar
            </button>
          </div>

          <p className="mt-2 text-[13.5px]">
            Você toca <strong>{minhas.length}</strong> {minhas.length === 1 ? "vez" : "vezes"} neste
            rodízio
            {proxima && (
              <>
                {" "}
                — a próxima é{" "}
                <strong>
                  {proxima.data === hoje ? "hoje" : DIAS[diaDaSemana(proxima.data)].toLowerCase()},{" "}
                  {dataNumerica(proxima.data)}
                  {proxima.hora && ` às ${formatarHora(proxima.hora)}`}
                </strong>
              </>
            )}
            .
          </p>

          {minhas.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {minhas.map((e) => (
                <li
                  key={e.data}
                  className={`rounded-portal bg-white px-2.5 py-1 text-[12.5px] font-bold text-azul ${
                    hoje && e.data < hoje ? "opacity-50" : ""
                  }`}
                >
                  {DIAS[diaDaSemana(e.data)].slice(0, 3)} {dataNumerica(e.data)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!minha && soVer && rodizio.organistas.length > 0 && (
        <button
          type="button"
          onClick={() => setSoVer(false)}
          className="self-start text-[12.5px] underline"
        >
          Destacar minhas datas
        </button>
      )}

      {porMes(rodizio.escala).map(([mes, linhas]) => {
        const [ano, m] = mes.split("-").map(Number);
        return (
          <section key={mes} className="bg-superficie shadow-portal rounded-portal overflow-hidden">
            <h2 className="border-cinza border-b px-4 py-2.5 text-[14px]">
              {MESES[m - 1]} {ano}
            </h2>
            <ul>
              {linhas.map((e) => {
                const dela = minha !== null && e.organista_id === minha;
                const passou = hoje !== "" && e.data < hoje;
                return (
                  <li
                    key={e.data}
                    aria-current={dela ? "true" : undefined}
                    className={`border-cinza flex items-center gap-3 border-b px-4 py-2.5 text-[13px] last:border-b-0 ${
                      dela ? "bg-azul/10 border-l-azul border-l-4 pl-3" : ""
                    } ${passou ? "opacity-50" : ""}`}
                  >
                    <span className="w-[86px] shrink-0">
                      <span className="text-azul font-bold">{dataNumerica(e.data)}</span>{" "}
                      <span className="text-[12px]">{DIAS[diaDaSemana(e.data)].slice(0, 3)}</span>
                    </span>
                    <span className="w-[44px] shrink-0 text-[12px]">{formatarHora(e.hora)}</span>
                    <span className={`flex-1 ${dela ? "text-azul font-bold" : ""}`}>
                      {e.organista_id ? (nomes.get(e.organista_id) ?? "—") : "—"}
                    </span>
                    {e.data === hoje && (
                      <span className="bg-vermelho rounded px-1.5 py-0.5 text-[11px] font-bold text-white">
                        Hoje
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {rodizio.observacoes && (
        <p className="border-cinza rounded-portal border p-4 text-[12.5px]">{rodizio.observacoes}</p>
      )}
    </div>
  );
}
