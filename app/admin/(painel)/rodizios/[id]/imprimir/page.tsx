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

/**
 * Quantas vias cabem numa folha A4 depende do tamanho da escala. Cada folha tem
 * altura fixa e as vias ocupam células iguais, então nenhuma via é cortada entre
 * páginas e as linhas de recorte ficam alinhadas.
 *  - até LINHAS_QUARTO datas: 4 vias por folha (2 × 2);
 *  - até LINHAS_MEIA: 2 vias por folha, a lista em duas colunas;
 *  - acima disso: 1 via por folha, a lista em duas colunas.
 */
const LINHAS_QUARTO = 14;
const LINHAS_MEIA = 28;

function emGrupos<T>(itens: T[], tamanho: number): T[][] {
  const grupos: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) grupos.push(itens.slice(i, i + tamanho));
  return grupos;
}

export default async function ImprimirRodizio({
  params,
}: PageProps<"/admin/rodizios/[id]/imprimir">) {
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
  const linhas = rodizio.escala.length;
  const porFolha = linhas <= LINHAS_QUARTO ? 4 : linhas <= LINHAS_MEIA ? 2 : 1;
  const larga = porFolha < 4;
  const grade =
    porFolha === 4
      ? "grid-cols-2 grid-rows-2"
      : porFolha === 2
        ? "grid-cols-1 grid-rows-2"
        : "grid-cols-1 grid-rows-1";
  const folhas = emGrupos(organistas, porFolha);

  return (
    <div>
      {/* Margem zero na página tira o cabeçalho e o rodapé do navegador (título,
          URL, "Page 1 of 2"); a margem de verdade fica no padding de cada folha. */}
      <style>{`@page { size: A4; margin: 0; }`}</style>

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

      <div className="flex flex-col gap-6 print:gap-0">
        {folhas.map((folha, i) => (
          <div
            key={i}
            className={`grid gap-0 ${grade} print:h-[296mm] print:w-[210mm] print:overflow-hidden print:p-[8mm] print:break-after-page print:last:break-after-auto`}
          >
            {folha.map((o) => {
              const minhas = rodizio.escala.filter((e) => e.organista_id === o.id);
              return (
                <article
                  key={o.id}
                  className="min-h-0 overflow-hidden border border-dashed border-neutral-500 px-4 py-3 text-[11px] text-black"
                >
                  <p className="text-[9.5px] tracking-wide uppercase">Rodízio de organistas</p>
                  <p className="font-bold">
                    {comum} · {periodo}
                  </p>

                  <p className="mt-2 border-y-2 border-black py-1 text-center text-[15px] leading-tight font-bold">
                    {o.nome}
                  </p>
                  <p className="mt-1.5">
                    <strong>
                      Você toca {minhas.length} {minhas.length === 1 ? "vez" : "vezes"}:
                    </strong>{" "}
                    {minhas.map((e) => dataNumerica(e.data)).join(", ") || "—"}
                  </p>

                  <ul
                    className={`mt-2 text-[10px] leading-tight ${larga ? "columns-2 gap-4" : ""}`}
                  >
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
        ))}
      </div>
    </div>
  );
}
