"use client";

import { useEffect, useRef, useState } from "react";

import { LinkComum } from "@/components/site/link-comum";
import { Bolinha } from "@/components/site/selo";
import { DIAS_CURTO, dataLonga, formatarHora } from "@/lib/datas";
import type { Evento } from "@/lib/ensaios";

export type EventoNaGrade = Evento & { cor: string; label: string };

/**
 * Grade mensal. O HTML inteiro vem renderizado do servidor — o JavaScript só
 * cuida do modal do dia. Sem JS, a visão Agenda mostra a mesma informação.
 */
export function GradeCalendario({
  ano,
  mes,
  eventos,
  hoje,
}: {
  ano: number;
  mes: number;
  eventos: EventoNaGrade[];
  hoje: string;
}) {
  const [diaAberto, setDiaAberto] = useState<string | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (diaAberto) dialogo.current?.showModal();
    else dialogo.current?.close();
  }, [diaAberto]);

  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const dowDoPrimeiro = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();

  const celulas: (string | null)[] = [
    ...Array.from({ length: dowDoPrimeiro }, () => null),
    ...Array.from(
      { length: diasNoMes },
      (_, i) => `${ano}-${String(mes).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    ),
  ];
  // Completa a última semana para as linhas ficarem sempre alinhadas.
  while (celulas.length % 7 !== 0) celulas.push(null);

  const doDia = (data: string) => eventos.filter((e) => e.data === data);
  const eventosAbertos = diaAberto ? doDia(diaAberto) : [];

  return (
    <>
      <div className="bg-superficie shadow-portal rounded-portal overflow-hidden">
        <div className="border-cinza grid grid-cols-7 border-b">
          {DIAS_CURTO.map((d) => (
            <div key={d} className="text-azul py-2 text-center text-[11.5px] font-bold">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {celulas.map((data, i) => {
            if (!data) return <div key={`vazio-${i}`} className="border-cinza min-h-24 border-r border-b last:border-r-0" />;

            const doDiaAtual = doDia(data);
            const ehHoje = data === hoje;
            const dia = Number(data.slice(8));

            return (
              <button
                key={data}
                type="button"
                onClick={() => setDiaAberto(data)}
                disabled={doDiaAtual.length === 0}
                aria-label={`${dataLonga(data)}${doDiaAtual.length ? ` — ${doDiaAtual.length} evento(s)` : " — sem eventos"}`}
                className="border-cinza min-h-24 border-r border-b p-1.5 text-left align-top disabled:cursor-default"
              >
                <span
                  className={`inline-grid size-6 place-items-center rounded-full text-[12px] font-bold ${
                    ehHoje ? "bg-vermelho text-white" : "text-azul"
                  }`}
                >
                  {dia}
                </span>

                <span className="mt-1 flex flex-col gap-0.5">
                  {doDiaAtual.slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className="truncate rounded px-1 py-0.5 text-[10.5px] leading-tight text-white"
                      style={{ backgroundColor: e.cor }}
                      title={`${e.label}${e.congregacaoNome ? ` — ${e.congregacaoNome}` : ""}`}
                    >
                      {e.congregacaoNome ?? e.label}
                    </span>
                  ))}
                  {doDiaAtual.length > 2 && (
                    <span className="text-azul px-1 text-[10.5px] font-bold">
                      +{doDiaAtual.length - 2} mais
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <dialog
        ref={dialogo}
        aria-label={diaAberto ? dataLonga(diaAberto) : "Eventos do dia"}
        onClose={() => setDiaAberto(null)}
        onClick={(e) => {
          if (e.target === dialogo.current) setDiaAberto(null);
        }}
        className="bg-superficie shadow-portal rounded-portal m-auto w-[calc(100%-2rem)] max-w-[460px] backdrop:bg-black/50"
      >
        <div className="p-5">
          <h2 className="text-base">{diaAberto ? dataLonga(diaAberto) : ""}</h2>

          <ul className="mt-3 flex flex-col gap-3">
            {eventosAbertos.map((e) => (
              <li key={e.id} className="flex gap-2">
                <Bolinha cor={e.cor} />
                <span>
                  <span className="text-azul block text-[13px] font-bold">
                    {e.hora && `${formatarHora(e.hora)} · `}
                    {e.label}
                  </span>
                  {e.congregacaoSlug && (
                    <LinkComum slug={e.congregacaoSlug} nome={e.congregacaoNome} />
                  )}
                  {e.descricao && <span className="block text-[12px]">{e.descricao}</span>}
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setDiaAberto(null)}
            className="bg-azul rounded-portal mt-5 px-4 py-2 text-[12.5px] font-bold text-white"
          >
            Fechar
          </button>
        </div>
      </dialog>
    </>
  );
}
