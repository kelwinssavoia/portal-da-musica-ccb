import Link from "next/link";
import { notFound } from "next/navigation";

import { Imprimir } from "@/components/admin/imprimir";
import { ordenarPorNome } from "@/lib/dados/congregacoes";
import { rodizioCompleto } from "@/lib/dados/rodizios";
import { DIAS_CURTO, dataNumerica, formatarHora, periodoEmTexto } from "@/lib/datas";
import { exigirArea } from "@/lib/permissoes";
import { diaDaSemana } from "@/lib/rodizio";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Imprimir rodízio" };

/** Acima disso a via ocupa a largura da folha, com a lista em duas colunas. */
const LINHAS_MEIA_FOLHA = 16;

export default async function ImprimirRodizio({ params }: PageProps<"/admin/rodizios/[id]/imprimir">) {
  await exigirArea("rodizios");
  const { id } = await params;

  const supabase = await clienteServidor();
  const rodizio = await rodizioCompleto(supabase, id);
  if (!rodizio) notFound();

  const ids = rodizio.participantes.map((p) => p.organista_id);
  const { data } = await supabase.from("organistas").select("id, nome").in("id", ids);
  const organistas = ordenarPorNome(data ?? []);
  const nomes = new Map(organistas.map((o) => [o.id, o.nome]));

  const comum = rodizio.comum?.nome ?? "";
  const periodo = periodoEmTexto(rodizio.inicio, rodizio.fim);
  const larga = rodizio.escala.length > LINHAS_MEIA_FOLHA;

  return (
    <div>
      {/* Folha A4 com margem pequena: cabe mais via por página. */}
      <style>{`@page { size: A4; margin: 8mm; }`}</style>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link href={`/admin/rodizios/${rodizio.id}`} className="text-[12.5px]">
            ← Voltar ao rodízio
          </Link>
          <h1 className="mt-1 text-xl">Imprimir — {comum}</h1>
          <p className="mt-1 text-[12.5px]">
            {organistas.length} vias, uma por organista. Recorte pela linha tracejada.
          </p>
        </div>
        <Imprimir />
      </div>

      <div className={`grid gap-0 ${larga ? "grid-cols-1" : "grid-cols-2"}`}>
        {organistas.map((o) => {
          const minhas = rodizio.escala.filter((e) => e.organista_id === o.id);
          return (
            <article
              key={o.id}
              className="break-inside-avoid border border-dashed border-neutral-500 p-4 text-[11px] text-black"
            >
              <p className="text-[9.5px] tracking-wide uppercase">Rodízio de organistas</p>
              <p className="font-bold">
                {comum} · {periodo}
              </p>

              <p className="mt-2 border-y-2 border-black py-1 text-center text-[17px] font-bold">
                {o.nome}
              </p>
              <p className="mt-1.5">
                <strong>
                  Você toca {minhas.length} {minhas.length === 1 ? "vez" : "vezes"}:
                </strong>{" "}
                {minhas.map((e) => dataNumerica(e.data)).join(", ") || "—"}
              </p>

              <ul className={`mt-2 ${larga ? "columns-2 gap-4" : ""}`}>
                {rodizio.escala.map((e) => {
                  const dela = e.organista_id === o.id;
                  return (
                    <li
                      key={e.data}
                      className={`flex break-inside-avoid gap-2 px-1 py-0.5 ${
                        dela
                          ? "bg-neutral-300 font-bold [print-color-adjust:exact]"
                          : "border-b border-neutral-200"
                      }`}
                    >
                      <span className="w-3 shrink-0">{dela ? "►" : ""}</span>
                      <span className="w-[66px] shrink-0 whitespace-nowrap">
                        {DIAS_CURTO[diaDaSemana(e.data)]} {dataNumerica(e.data)}
                      </span>
                      <span className="w-[38px] shrink-0 whitespace-nowrap">
                        {formatarHora(e.hora)}
                      </span>
                      <span className={dela ? "uppercase" : ""}>
                        {e.organista_id ? (nomes.get(e.organista_id) ?? "") : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {rodizio.observacoes && <p className="mt-2 italic">{rodizio.observacoes}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
