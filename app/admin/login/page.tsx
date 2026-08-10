import { Suspense } from "react";

import { FormLogin } from "@/components/admin/form-login";
import { getAjustes } from "@/lib/ajustes";

export const metadata = { title: "Entrar", robots: { index: false, follow: false } };

export default function Login({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-4 py-10">
      <Suspense fallback={null}>
        <Cartao searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Cartao({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { destino } = await searchParams;
  const { titulo, regiao } = await getAjustes();

  const alvo = typeof destino === "string" && destino.startsWith("/admin") ? destino : "/admin";

  return (
    <div className="bg-superficie shadow-portal rounded-portal p-6">
      <h1 className="text-lg">{titulo}</h1>
      <p className="mt-0.5 text-[12.5px]">
        {regiao} · área de manutenção do portal
      </p>

      <div className="mt-5">
        <FormLogin destino={alvo} />
      </div>
    </div>
  );
}
