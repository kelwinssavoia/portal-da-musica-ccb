import Link from "next/link";

import { listarCongregacoes } from "@/lib/dados/congregacoes";
import { diaEHora, frequenciaEnsaio, padraoEnsaio } from "@/lib/datas";
import { exigirArea } from "@/lib/permissoes";

export const metadata = { title: "Congregações" };

export default async function AdminCongregacoes() {
  await exigirArea("congregacoes");
  const congregacoes = await listarCongregacoes();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl">Congregações</h1>
          <p className="mt-1 text-[13px]">{congregacoes.length} cadastradas</p>
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
              <th className="px-4 py-2.5">Culto</th>
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
                <td className="px-4 py-2.5">{diaEHora(c.culto_dow, c.culto_hora) || "—"}</td>
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
    </div>
  );
}
