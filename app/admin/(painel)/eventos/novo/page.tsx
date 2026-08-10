import { FormEvento } from "@/components/admin/form-evento";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Novo evento" };

export default async function NovoEvento() {
  await exigirArea("eventos");

  const supabase = await clienteServidor();
  const [tipos, congregacoes] = await Promise.all([
    supabase.from("tipos_evento").select("*").order("ordem"),
    supabase.from("congregacoes").select("*").order("nome"),
  ]);

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="text-xl">Novo evento</h1>
      <div className="mt-5">
        <FormEvento tipos={tipos.data ?? []} congregacoes={congregacoes.data ?? []} />
      </div>
    </div>
  );
}
