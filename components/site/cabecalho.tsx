import Link from "next/link";

import { CampoBusca } from "@/components/site/campo-busca";
import { getAjustes } from "@/lib/ajustes";

/** Cabeçalho cinza: marca (leva ao Início) + busca global. */
export async function Cabecalho() {
  const { titulo, subtitulo } = await getAjustes();

  return (
    <div className="bg-cinza">
      <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center justify-between gap-[18px] px-4 py-[22px]">
        <Link href="/" className="flex items-center gap-[13px] no-underline hover:no-underline">
          {/* Clave de sol — marcador neutro. O emblema oficial da CCB não é usado. */}
          <span
            aria-hidden="true"
            className="font-marca bg-azul text-cinza grid size-11 shrink-0 place-items-center text-[22px] leading-none"
          >
            &#119070;
          </span>
          <span>
            <span className="text-azul block text-xl leading-tight font-bold tracking-tight">
              {titulo}
            </span>
            <span className="text-azul block text-[12.5px] opacity-85">{subtitulo}</span>
          </span>
        </Link>

        <CampoBusca />
      </div>
    </div>
  );
}
