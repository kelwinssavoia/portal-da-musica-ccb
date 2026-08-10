
import { LinkComum } from "@/components/site/link-comum";
import { Bolinha, Selo } from "@/components/site/selo";
import { DIAS_CURTO, MESES_CURTO, formatarHora } from "@/lib/datas";
import { destaqueDe } from "@/lib/destaque";
import { partesISO, type Evento } from "@/lib/ensaios";
import type { TipoEvento } from "@/lib/tipos-banco";

/** Bloco de data à esquerda de cada evento: dia grande, mês e dia da semana. */
function BlocoData({ data }: { data: string }) {
  const { ano, mes, dia } = partesISO(data);
  const dow = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();

  return (
    <div className="border-cinza w-12 shrink-0 border-r pr-3 text-center">
      <div className="text-azul text-lg leading-none font-bold">{dia}</div>
      <div className="text-[10.5px] uppercase opacity-75">{MESES_CURTO[mes - 1]}</div>
      <div className="text-[10.5px] opacity-60">{DIAS_CURTO[dow]}</div>
    </div>
  );
}

export function ProximosEventos({
  eventos,
  tipos,
  hoje,
}: {
  eventos: Evento[];
  tipos: TipoEvento[];
  hoje: string;
}) {
  if (eventos.length === 0) {
    return <p className="text-[13px]">Nenhum evento agendado no momento.</p>;
  }

  const porTipo = new Map(tipos.map((t) => [t.id, t]));

  return (
    <ul className="bg-superficie shadow-portal rounded-portal overflow-hidden">
      {eventos.map((e) => {
        const tipo = porTipo.get(e.tipoId);
        const destaque = destaqueDe(e.data, hoje);

        return (
          <li
            key={e.id}
            className="border-cinza flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <BlocoData data={e.data} />

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Bolinha cor={tipo?.cor ?? "#033d60"} />
                <span className="text-azul text-[13px] font-bold">{tipo?.label ?? e.titulo}</span>
                <Selo destaque={destaque} />
              </div>

              <p className="mt-0.5 text-[12.5px]">
                {e.congregacaoSlug ? (
                  <LinkComum slug={e.congregacaoSlug} nome={e.congregacaoNome} />
                ) : (
                  e.congregacaoNome
                )}
                {e.hora && <span className="opacity-75"> · {formatarHora(e.hora)}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
