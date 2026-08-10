import { notFound } from "next/navigation";

import { FormEvento } from "@/components/admin/form-evento";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Editar evento" };

export default async function EditarEvento({ params }: PageProps<"/admin/eventos/[id]">) {
  await exigirArea("eventos");
  const { id } = await params;

  const supabase = await clienteServidor();
  const [evento, tipos, congregacoes] = await Promise.all([
    supabase.from("eventos").select("*").eq("id", id).maybeSingle(),
    supabase.from("tipos_evento").select("*").order("ordem"),
    supabase.from("congregacoes").select("*").order("ordem").order("nome"),
  ]);

  if (!evento.data) notFound();

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="text-xl">{evento.data.titulo}</h1>
      <div className="mt-5">
        <FormEvento
          evento={evento.data}
          tipos={tipos.data ?? []}
          congregacoes={congregacoes.data ?? []}
        />
      </div>
    </div>
  );
}
