import Link from "next/link";

import { AREAS, areaAtiva } from "@/lib/navegacao";

/**
 * Menu das áreas, sem saber por conta própria qual está ativa.
 *
 * Fica separado porque `usePathname()` é dado de tempo de execução: com Cache
 * Components ele precisa ficar dentro de um `<Suspense>`. Este componente é o
 * conteúdo dos dois lados — o fallback (sem marcador) e a versão hidratada.
 */
export function MenuBase({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Áreas do portal"
      className="bg-superficie border-cinza sticky top-0 z-20 border-t-2 border-b-2"
    >
      <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-stretch px-4">
        {AREAS.map((area, i) => {
          const ativa = pathname !== "" && areaAtiva(area.href, pathname);

          return (
            <Link
              key={area.href}
              href={area.href}
              aria-current={ativa ? "page" : undefined}
              className="text-azul relative px-4 py-[13px] text-xs font-bold whitespace-nowrap no-underline hover:no-underline"
            >
              {area.nome}
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="bg-cinza absolute top-[11px] bottom-[11px] left-0 w-0.5"
                />
              )}
              {ativa && (
                <span
                  aria-hidden="true"
                  className="bg-azul absolute right-4 bottom-0 left-4 h-0.5"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
