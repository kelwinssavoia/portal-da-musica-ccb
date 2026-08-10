import { notFound } from "next/navigation";

import { FormCircular } from "@/components/admin/form-circular";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Editar circular" };

export default async function EditarCircular({ params }: PageProps<"/admin/circulares/[id]">) {
  await exigirArea("circulares");
  const { id } = await params;

  const supabase = await clienteServidor();
  const { data: circular } = await supabase
    .from("circulares")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!circular) notFound();

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="text-xl">{circular.titulo}</h1>
      <div className="mt-5">
        <FormCircular circular={circular} />
      </div>
    </div>
  );
}
