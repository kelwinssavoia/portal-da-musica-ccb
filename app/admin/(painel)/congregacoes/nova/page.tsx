import { FormCongregacao } from "@/components/admin/form-congregacao";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Nova comum" };

export default async function NovaCongregacao() {
  await exigirArea("congregacoes");

  const supabase = await clienteServidor();
  const { data: cidades } = await supabase.from("cidades").select("*").order("nome");

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="text-xl">Nova comum</h1>
      <div className="mt-5">
        <FormCongregacao cidades={cidades ?? []} />
      </div>
    </div>
  );
}
