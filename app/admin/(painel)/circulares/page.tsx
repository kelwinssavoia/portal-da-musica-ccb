import Link from "next/link";

import { dataLonga } from "@/lib/datas";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Circulares" };

export default async function AdminCirculares() {
  await exigirArea("circulares");

  const supabase = await clienteServidor();
  const { data: circulares } = await supabase
    .from("circulares")
    .select("*")
    .order("data", { ascending: false });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl">Circulares</h1>
          <p className="mt-1 text-[13px]">{circulares?.length ?? 0} cadastradas</p>
        </div>
        <Link
          href="/admin/circulares/nova"
          className="bg-azul rounded-portal px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:text-white hover:no-underline"
        >
          Nova circular
        </Link>
      </div>

      {(circulares?.length ?? 0) === 0 ? (
        <p className="text-[13px]">Nenhuma circular ainda.</p>
      ) : (
        <div className="bg-superficie shadow-portal rounded-portal overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-[12.5px]">
            <thead className="border-cinza text-azul border-b">
              <tr>
                <th className="px-4 py-2.5">Título</th>
                <th className="px-4 py-2.5">Número</th>
                <th className="px-4 py-2.5">Data</th>
                <th className="px-4 py-2.5">Origem</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {(circulares ?? []).map((c) => (
                <tr key={c.id} className="border-cinza border-b last:border-b-0">
                  <td className="px-4 py-2.5">
                    <span className="text-azul font-bold">{c.titulo}</span>
                    {!c.publicado && <span className="ml-2 opacity-60">(rascunho)</span>}
                  </td>
                  <td className="px-4 py-2.5">{c.numero}</td>
                  <td className="px-4 py-2.5">{dataLonga(c.data)}</td>
                  <td className="px-4 py-2.5">{c.origem === "upload" ? "PDF no portal" : "link"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/admin/circulares/${c.id}`}>Editar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
