import { notFound } from "next/navigation";

import { FormArquivo } from "@/components/admin/form-arquivo";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";
import { urlDoArquivo } from "@/lib/storage";

export const metadata = { title: "Editar arquivo" };

export default async function EditarArquivo({ params }: PageProps<"/admin/arquivos/[id]">) {
  await exigirArea("arquivos");
  const { id } = await params;

  const supabase = await clienteServidor();
  const [arquivo, categorias] = await Promise.all([
    supabase.from("arquivos").select("*").eq("id", id).maybeSingle(),
    supabase.from("arquivo_categorias").select("*").order("ordem").order("nome"),
  ]);

  if (!arquivo.data) notFound();

  const href = urlDoArquivo(arquivo.data);

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl">{arquivo.data.titulo}</h1>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[12.5px]">
            Abrir arquivo →
          </a>
        )}
      </div>
      <div className="mt-5">
        <FormArquivo arquivo={arquivo.data} categorias={categorias.data ?? []} />
      </div>
    </div>
  );
}
