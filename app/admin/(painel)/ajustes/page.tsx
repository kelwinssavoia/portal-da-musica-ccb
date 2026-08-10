import { FormAjustes, FormIndexavel } from "@/components/admin/form-ajustes";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Ajustes" };

export default async function AdminAjustes() {
  await exigirArea("ajustes");

  const supabase = await clienteServidor();
  const { data } = await supabase.from("ajustes").select("chave, valor");

  const valores = Object.fromEntries((data ?? []).map((a) => [a.chave, a.valor]));

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6">
      <div>
        <h1 className="text-xl">Ajustes</h1>
        <p className="mt-1 text-[13px]">Textos institucionais e opções gerais do portal.</p>
      </div>

      <section className="bg-superficie shadow-portal rounded-portal p-5">
        <h2 className="text-base">Textos</h2>
        <div className="mt-4">
          <FormAjustes valores={valores} />
        </div>
      </section>

      <section className="bg-superficie shadow-portal rounded-portal p-5">
        <h2 className="text-base">Aparecer em buscadores</h2>
        <div className="mt-4">
          <FormIndexavel indexavel={(valores.indexavel ?? "sim").toLowerCase() !== "nao"} />
        </div>
      </section>
    </div>
  );
}
