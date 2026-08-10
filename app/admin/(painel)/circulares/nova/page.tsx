import { FormCircular } from "@/components/admin/form-circular";
import { exigirArea } from "@/lib/permissoes";

export const metadata = { title: "Nova circular" };

export default async function NovaCircular() {
  await exigirArea("circulares");

  return (
    <div className="mx-auto max-w-[720px]">
      <h1 className="text-xl">Nova circular</h1>
      <div className="mt-5">
        <FormCircular />
      </div>
    </div>
  );
}
