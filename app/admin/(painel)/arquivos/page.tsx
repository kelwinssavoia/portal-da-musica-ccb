import Link from "next/link";

import { FormCategoria } from "@/components/admin/form-arquivo";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Arquivos" };

export default async function AdminArquivos() {
  await exigirArea("arquivos");

  const supabase = await clienteServidor();
  const [categorias, arquivos] = await Promise.all([
    supabase.from("arquivo_categorias").select("*").order("ordem").order("nome"),
    supabase.from("arquivos").select("*").order("ordem").order("titulo"),
  ]);

  const porCategoria = (id: string) => (arquivos.data ?? []).filter((a) => a.categoria_id === id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl">Arquivos da secretaria</h1>
          <p className="mt-1 text-[13px]">
            {arquivos.data?.length ?? 0} arquivos em {categorias.data?.length ?? 0} categorias
          </p>
        </div>
        <Link
          href="/admin/arquivos/nova"
          className="bg-azul rounded-portal px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:text-white hover:no-underline"
        >
          Novo arquivo
        </Link>
      </div>

      {(categorias.data ?? []).map((cat) => {
        const itens = porCategoria(cat.id);

        return (
          <section key={cat.id} className="bg-superficie shadow-portal rounded-portal">
            <div className="border-cinza flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3">
              <h2 className="text-base">
                {cat.nome}
                {!cat.ativo && <span className="ml-2 text-[12px] font-normal opacity-60">(oculta)</span>}
              </h2>
              <span className="text-[12px] opacity-70">{itens.length} arquivo(s)</span>
            </div>

            {itens.length === 0 ? (
              <p className="px-4 py-3 text-[12.5px]">Nenhum arquivo nesta categoria.</p>
            ) : (
              <table className="w-full text-left text-[12.5px]">
                <tbody>
                  {itens.map((a) => (
                    <tr key={a.id} className="border-cinza border-b last:border-b-0">
                      <td className="px-4 py-2.5">
                        <span className="text-azul font-bold">{a.titulo}</span>
                        {!a.ativo && <span className="ml-2 opacity-60">(oculto)</span>}
                        {a.exemplo && <span className="ml-2 opacity-60">exemplo</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {a.origem === "upload" ? `no portal · v${a.versao}` : "link externo"}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link href={`/admin/arquivos/${a.id}`}>Editar</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <details className="border-cinza border-t">
              <summary className="text-azul cursor-pointer px-4 py-2.5 text-[12px] font-bold">
                Editar categoria
              </summary>
              <div className="p-4">
                <FormCategoria categoria={cat} />
              </div>
            </details>
          </section>
        );
      })}

      <section className="bg-superficie shadow-portal rounded-portal p-5">
        <h2 className="text-base">Nova categoria</h2>
        <div className="mt-4">
          <FormCategoria />
        </div>
      </section>
    </div>
  );
}
