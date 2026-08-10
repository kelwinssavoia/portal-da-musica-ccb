import { FormDuvida } from "@/components/admin/form-duvida";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Dúvidas" };

export default async function AdminDuvidas() {
  await exigirArea("duvidas");

  const supabase = await clienteServidor();
  const { data: duvidas } = await supabase
    .from("duvidas")
    .select("*")
    .order("ordem")
    .order("pergunta");

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6">
      <div>
        <h1 className="text-xl">Dúvidas frequentes</h1>
        <p className="mt-1 text-[13px]">
          Aparecem em acordeão na área Secretaria do portal.
        </p>
      </div>

      <section className="bg-superficie shadow-portal rounded-portal p-5">
        <h2 className="text-base">Nova dúvida</h2>
        <div className="mt-4">
          <FormDuvida />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base">{duvidas?.length ?? 0} cadastradas</h2>

        {(duvidas ?? []).map((d) => (
          <details key={d.id} className="bg-superficie shadow-portal rounded-portal">
            <summary className="text-azul cursor-pointer px-4 py-3 text-[13px] font-bold">
              {d.pergunta}
              {!d.ativo && <span className="ml-2 font-normal opacity-60">(oculta)</span>}
            </summary>
            <div className="border-cinza border-t p-4">
              <FormDuvida duvida={d} />
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
