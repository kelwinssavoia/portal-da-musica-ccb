import { Suspense } from "react";
import Link from "next/link";

import { GradeCalendario, type EventoNaGrade } from "@/components/site/grade-calendario";
import { Bolinha, Selo } from "@/components/site/selo";
import { MESES, dataLonga, formatarHora } from "@/lib/datas";
import { hoje as hojeDaRegional } from "@/lib/hoje";
import { eventosDoPeriodo, listarTiposEvento } from "@/lib/dados/eventos";
import { destaqueDe } from "@/lib/destaque";
import { diasNoMes, iso, partesISO } from "@/lib/ensaios";

export const metadata = {
  title: "Calendário",
  description: "Ensaios locais e regionais, testes e reuniões de secretaria da região.",
};

export default function Calendario({ searchParams }: PageProps<"/calendario">) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl">Calendário</h1>

      <Suspense fallback={<p className="text-[13px]">Carregando calendário…</p>}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/** `?mes=YYYY-MM` inválido ou ausente cai no mês atual. */
function mesPedido(valor: unknown, hoje: string): { ano: number; mes: number } {
  if (typeof valor === "string" && /^\d{4}-\d{2}$/.test(valor)) {
    const [ano, mes] = valor.split("-").map(Number);
    if (mes >= 1 && mes <= 12) return { ano, mes };
  }
  const { ano, mes } = partesISO(hoje);
  return { ano, mes };
}

function paramMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/calendario">["searchParams"] }) {
  const params = await searchParams;
  const hoje = await hojeDaRegional();
  const { ano, mes } = mesPedido(params.mes, hoje);
  const agenda = params.modo === "agenda";

  const de = iso(ano, mes, 1);
  const ate = iso(ano, mes, diasNoMes(ano, mes));

  const [eventos, tipos] = await Promise.all([eventosDoPeriodo(de, ate), listarTiposEvento()]);

  const porTipo = new Map(tipos.map((t) => [t.id, t]));
  const decorados: EventoNaGrade[] = eventos.map((e) => ({
    ...e,
    cor: porTipo.get(e.tipoId)?.cor ?? "#033d60",
    label: porTipo.get(e.tipoId)?.label ?? e.titulo,
  }));

  const anterior = mes === 1 ? paramMes(ano - 1, 12) : paramMes(ano, mes - 1);
  const proximo = mes === 12 ? paramMes(ano + 1, 1) : paramMes(ano, mes + 1);
  const modo = agenda ? "&modo=agenda" : "";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/calendario?mes=${anterior}${modo}`}
            aria-label="Mês anterior"
            className="border-cinza bg-superficie rounded-portal border px-2.5 py-1 text-[13px] font-bold no-underline"
          >
            ←
          </Link>
          <span className="text-azul min-w-[150px] text-center text-[15px] font-bold">
            {MESES[mes - 1]} de {ano}
          </span>
          <Link
            href={`/calendario?mes=${proximo}${modo}`}
            aria-label="Mês seguinte"
            className="border-cinza bg-superficie rounded-portal border px-2.5 py-1 text-[13px] font-bold no-underline"
          >
            →
          </Link>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/calendario?mes=${paramMes(ano, mes)}`}
            className={`border-cinza rounded-portal border px-3 py-1.5 text-[12.5px] font-bold no-underline ${
              !agenda ? "bg-azul text-white" : "bg-superficie text-azul"
            }`}
          >
            Grade mensal
          </Link>
          <Link
            href={`/calendario?mes=${paramMes(ano, mes)}&modo=agenda`}
            className={`border-cinza rounded-portal border px-3 py-1.5 text-[12.5px] font-bold no-underline ${
              agenda ? "bg-azul text-white" : "bg-superficie text-azul"
            }`}
          >
            Agenda
          </Link>
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {tipos.map((t) => (
          <li key={t.id} className="flex items-center gap-1.5 text-[12px]">
            <Bolinha cor={t.cor} />
            {t.label}
          </li>
        ))}
      </ul>

      {agenda ? (
        <Agenda eventos={decorados} hoje={hoje} />
      ) : (
        <GradeCalendario ano={ano} mes={mes} eventos={decorados} hoje={hoje} />
      )}
    </>
  );
}

/** Lista por data. É a visão que funciona sem JavaScript nenhum. */
function Agenda({ eventos, hoje }: { eventos: EventoNaGrade[]; hoje: string }) {
  if (eventos.length === 0) {
    return <p className="text-[13px]">Nenhum evento neste mês.</p>;
  }

  return (
    <ul className="bg-superficie shadow-portal rounded-portal overflow-hidden">
      {eventos.map((e) => {
        const destaque = destaqueDe(e.data, hoje);

        return (
          <li key={e.id} className="border-cinza flex gap-3 border-b px-4 py-3 last:border-b-0">
            <Bolinha cor={e.cor} />

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-azul text-[13px] font-bold">{dataLonga(e.data)}</span>
                {e.hora && <span className="text-[12.5px] opacity-80">{formatarHora(e.hora)}</span>}
                <Selo destaque={destaque} />
              </div>

              <p className="mt-0.5 text-[12.5px]">{e.label}</p>

              {e.congregacaoSlug && (
                <Link href={`/congregacoes/${e.congregacaoSlug}`} className="text-[12.5px]">
                  {e.congregacaoNome}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
