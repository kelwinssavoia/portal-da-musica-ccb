import { FormArquivo } from "@/components/admin/form-arquivo";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Novo arquivo" };

export default async function NovoArquivo() {
  await exigirArea("arquivos");

  const supabase = await clienteServidor();
  const { data: categorias } = await supabase
    .from("arquivo_categorias")
    .select("*")
    .order("ordem")
    .order("nome");

  if (!categorias || categorias.length === 0) {
    return (
      <div className="mx-auto max-w-[720px]">
        <h1 className="text-xl">Novo arquivo</h1>
        <p className="mt-3 text-[13px]">
          Crie uma categoria antes — todo arquivo pertence a uma.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="text-xl">Novo arquivo</h1>
      <div className="mt-5">
        <FormArquivo categorias={categorias} />
      </div>
    </div>
  );
}
