import Link from "next/link";

import { FormOrganista } from "@/components/admin/form-organista";
import { ordenarPorNome } from "@/lib/dados/congregacoes";
import { DIAS_CURTO, periodoEmTexto } from "@/lib/datas";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Rodízios de organistas" };

export default async function AdminRodizios() {
  await exigirArea("rodizios");

  const supabase = await clienteServidor();
  const [rodizios, comuns, organistas, participantes] = await Promise.all([
    supabase.from("rodizios").select("*").order("inicio", { ascending: false }),
    supabase.from("congregacoes").select("id, nome"),
    supabase.from("organistas").select("*"),
    supabase.from("rodizio_organistas").select("rodizio_id"),
  ]);

  const nomeComum = new Map((comuns.data ?? []).map((c) => [c.id, c.nome]));
  const quantas = new Map<string, number>();
  for (const p of participantes.data ?? []) {
    quantas.set(p.rodizio_id, (quantas.get(p.rodizio_id) ?? 0) + 1);
  }

  const comOrganistas = ordenarPorNome(comuns.data ?? [])
    .map((c) => ({
      ...c,
      organistas: ordenarPorNome((organistas.data ?? []).filter((o) => o.congregacao_id === c.id)),
    }))
    .filter((c) => c.organistas.length > 0);

  const lista = rodizios.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl">Rodízios de organistas</h1>
          <p className="mt-1 text-[13px]">
            Escala de quem toca em cada culto, por comum. As organistas recebem um link próprio — o
            rodízio não aparece no portal nem no Google.
          </p>
        </div>
        <Link
          href="/admin/rodizios/novo"
          className="bg-azul rounded-portal px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:text-white hover:no-underline"
        >
          Novo rodízio
        </Link>
      </div>

      <section>
        <h2 className="text-base">
          {lista.length} {lista.length === 1 ? "rodízio" : "rodízios"}
        </h2>

        {lista.length === 0 ? (
          <p className="mt-2 text-[13px]">Nenhum rodízio criado ainda.</p>
        ) : (
          <div className="bg-superficie shadow-portal rounded-portal mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[12.5px]">
              <thead className="border-cinza text-azul border-b">
                <tr>
                  <th className="px-4 py-2.5">Comum</th>
                  <th className="px-4 py-2.5">Período</th>
                  <th className="px-4 py-2.5">Organistas</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id} className="border-cinza border-b last:border-b-0">
                    <td className="text-azul px-4 py-2.5 font-bold">
                      {nomeComum.get(r.congregacao_id) ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">{periodoEmTexto(r.inicio, r.fim)}</td>
                    <td className="px-4 py-2.5">{quantas.get(r.id) ?? 0}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <Link href={`/admin/rodizios/${r.id}`}>Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {comOrganistas.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base">Organistas por comum</h2>
            <p className="mt-1 text-[12.5px]">
              Quem é nova entra pelo próprio rodízio. Aqui dá para corrigir o nome ou tirar alguém
              dos próximos rodízios.
            </p>
          </div>

          {comOrganistas.map((c) => (
            <details key={c.id} className="bg-superficie shadow-portal rounded-portal">
              <summary className="text-azul cursor-pointer px-4 py-3 text-[13px] font-bold">
                {c.nome}
                <span className="ml-2 font-normal opacity-70">
                  {c.organistas.filter((o) => o.ativo).length} ativa(s)
                </span>
              </summary>
              <ul className="border-cinza border-t">
                {c.organistas.map((o) => (
                  <li key={o.id} className="border-cinza border-b last:border-b-0">
                    <details>
                      <summary className="cursor-pointer px-4 py-2.5 text-[12.5px]">
                        <span className="text-azul font-bold">{o.nome}</span>
                        {!o.ativo && <span className="ml-2 opacity-60">(fora dos rodízios)</span>}
                        {o.dows_indisponiveis.length > 0 && (
                          <span className="ml-2 opacity-75">
                            não pode:{" "}
                            {o.dows_indisponiveis.map((d) => DIAS_CURTO[d]).join(", ")}
                          </span>
                        )}
                      </summary>
                      <div className="px-4 pb-4">
                        <FormOrganista organista={o} />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
