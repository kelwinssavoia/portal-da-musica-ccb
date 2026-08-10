import { Suspense } from "react";
import Link from "next/link";

import { buscar } from "@/lib/dados/busca";
import { hoje as hojeDaRegional } from "@/lib/hoje";

export const metadata = {
  title: "Busca",
  // Página de resultado não tem por que ser indexada.
  robots: { index: false, follow: true },
};

export default function Buscar({ searchParams }: PageProps<"/buscar">) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<p className="text-[13px]">Buscando…</p>}>
        <Resultados searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Resultados({ searchParams }: { searchParams: PageProps<"/buscar">["searchParams"] }) {
  const { q } = await searchParams;
  const consulta = typeof q === "string" ? q : "";

  if (consulta.trim() === "") {
    return (
      <>
        <h1 className="text-xl">Busca</h1>
        <p className="text-[13px]">
          Use o campo no topo da página para procurar congregações, ensaios, eventos, circulares,
          arquivos e dúvidas.
        </p>
      </>
    );
  }

  const grupos = await buscar(consulta, await hojeDaRegional());
  const total = grupos.reduce((n, g) => n + g.itens.length, 0);

  return (
    <>
      <div>
        <h1 className="text-xl">Busca</h1>
        <p className="mt-1 text-[13px]">
          {total === 0 ? (
            <>
              Nada encontrado para <strong>{consulta}</strong>.
            </>
          ) : (
            <>
              {total} {total === 1 ? "resultado" : "resultados"} para <strong>{consulta}</strong>.
            </>
          )}
        </p>
      </div>

      {grupos.map((grupo) => (
        <section key={grupo.area}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base">{grupo.area}</h2>
            {grupo.total > grupo.itens.length && (
              <span className="text-[12px] opacity-70">
                mostrando {grupo.itens.length} de {grupo.total}
              </span>
            )}
          </div>

          <ul className="bg-superficie shadow-portal rounded-portal mt-2 overflow-hidden">
            {grupo.itens.map((item, i) => (
              <li key={`${item.href}-${i}`} className="border-cinza border-b last:border-b-0">
                <Link
                  href={item.href}
                  className="block px-4 py-3 no-underline hover:no-underline"
                >
                  <span className="text-azul block text-[13px] font-bold">{item.titulo}</span>
                  {item.sub && <span className="mt-0.5 block text-[12px]">{item.sub}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
