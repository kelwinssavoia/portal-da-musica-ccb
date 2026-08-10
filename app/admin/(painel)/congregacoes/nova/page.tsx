import { FormCongregacao } from "@/components/admin/form-congregacao";
import { exigirArea } from "@/lib/permissoes";

export const metadata = { title: "Nova comum" };

export default async function NovaCongregacao() {
  await exigirArea("congregacoes");

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="text-xl">Nova comum</h1>
      <div className="mt-5">
        <FormCongregacao />
      </div>
    </div>
  );
}
