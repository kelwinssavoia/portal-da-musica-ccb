import Link from "next/link";

import { FormCidade } from "@/components/admin/form-cidade";
import { nomeDaCidade } from "@/lib/cidades";
import { listarCongregacoes } from "@/lib/dados/congregacoes";
import { clienteServidor } from "@/lib/supabase/servidor";
import { cultosEmTexto, frequenciaEnsaio, padraoEnsaio } from "@/lib/datas";
import { exigirArea } from "@/lib/permissoes";

export const metadata = { title: "Congregações" };

export default async function AdminCongregacoes() {
  await exigirArea("congregacoes");

  const supabase = await clienteServidor();
  const [congregacoes, cidades] = await Promise.all([
    listarCongregacoes(),
    supabase.from("cidades").select("*").order("nome"),
  ]);
  const listaCidades = cidades.data ?? [];
  const semCidade = congregacoes.filter((c) => !c.cidade_id).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl">Congregações</h1>
          <p className="mt-1 text-[13px]">
            {congregacoes.length} cadastradas em {listaCidades.length}{" "}
            {listaCidades.length === 1 ? "cidade" : "cidades"}
          </p>
        </div>
        <Link
          href="/admin/congregacoes/nova"
          className="bg-azul rounded-portal px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:text-white hover:no-underline"
        >
          Nova comum
        </Link>
      </div>

      <div className="bg-superficie shadow-portal rounded-portal overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[12.5px]">
          <thead className="border-cinza text-azul border-b">
            <tr>
              <th className="px-4 py-2.5">Comum</th>
              <th className="px-4 py-2.5">Cidade</th>
              <th className="px-4 py-2.5">Cultos</th>
              <th className="px-4 py-2.5">Ensaio</th>
              <th className="px-4 py-2.5">Frequência</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {congregacoes.map((c) => (
              <tr key={c.id} className="border-cinza border-b last:border-b-0">
                <td className="px-4 py-2.5">
                  <span className="text-azul font-bold">{c.nome}</span>
                  {!c.ativo && <span className="ml-2 opacity-60">(oculta)</span>}
                </td>
                <td className="px-4 py-2.5">
                  {c.cidade ? (
                    nomeDaCidade(c.cidade)
                  ) : (
                    <span className="text-vermelho">sem cidade</span>
                  )}
                </td>
                <td className="px-4 py-2.5">{cultosEmTexto(c.cultos) || "—"}</td>
                <td className="px-4 py-2.5">
                  {padraoEnsaio(c.ensaio_ord, c.ensaio_dow, c.ensaio_hora) || "—"}
                </td>
                <td className="px-4 py-2.5">
                  {c.ensaio_ord !== null ? frequenciaEnsaio(c.ensaio_meses) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/congregacoes/${c.id}`}>Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {semCidade > 0 && listaCidades.length > 0 && (
        <p className="border-vermelho bg-vermelho/5 rounded-r-portal border-l-4 p-3 text-[12.5px]">
          {semCidade} {semCidade === 1 ? "comum está" : "comuns estão"} sem cidade. No portal
          {semCidade === 1 ? " ela aparece" : " elas aparecem"} num grupo separado, no fim da lista.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg">Cidades da região</h2>
          <p className="mt-1 text-[12.5px]">
            A lista de congregações do portal é agrupada por cidade. Cadastre aqui as cidades que a
            regional atende.
          </p>
        </div>

        {listaCidades.map((cid) => (
          <details key={cid.id} className="bg-superficie shadow-portal rounded-portal">
            <summary className="text-azul cursor-pointer px-4 py-3 text-[13px] font-bold">
              {nomeDaCidade(cid)}
              {!cid.ativo && <span className="ml-2 font-normal opacity-60">(inativa)</span>}
              <span className="ml-2 font-normal opacity-70">
                {congregacoes.filter((c) => c.cidade_id === cid.id).length} comum(ns)
              </span>
            </summary>
            <div className="border-cinza border-t p-4">
              <FormCidade cidade={cid} />
            </div>
          </details>
        ))}

        <div className="bg-superficie shadow-portal rounded-portal p-5">
          <h3 className="text-[13px] font-bold">Nova cidade</h3>
          <div className="mt-4">
            <FormCidade />
          </div>
        </div>
      </section>
    </div>
  );
}
