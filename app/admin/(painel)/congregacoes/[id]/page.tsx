import Link from "next/link";
import { notFound } from "next/navigation";

import { FormCongregacao } from "@/components/admin/form-congregacao";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Editar comum" };

export default async function EditarCongregacao({
  params,
}: PageProps<"/admin/congregacoes/[id]">) {
  await exigirArea("congregacoes");
  const { id } = await params;

  const supabase = await clienteServidor();
  const { data: congregacao } = await supabase
    .from("congregacoes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!congregacao) notFound();

  return (
    <div className="mx-auto max-w-[720px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl">{congregacao.nome}</h1>
        <Link href={`/congregacoes/${congregacao.slug}`} className="text-[12.5px]">
          Ver no portal →
        </Link>
      </div>
      <div className="mt-5">
        <FormCongregacao congregacao={congregacao} />
      </div>
    </div>
  );
}
