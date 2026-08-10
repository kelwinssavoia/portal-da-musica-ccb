import { IconeCircular } from "@/components/icones";
import { dataLonga } from "@/lib/datas";
import { urlDaCircular } from "@/lib/storage";
import type { Circular } from "@/lib/tipos-banco";

/** Card grande da circular mais recente. */
export function CircularDestaque({ circular: c }: { circular: Circular }) {
  const href = urlDaCircular(c);

  return (
    <article className="bg-superficie border-azul shadow-portal rounded-r-portal border-l-4 p-5">
      <div className="flex items-start gap-3">
        <IconeCircular className="text-azul mt-0.5 size-5 shrink-0" />
        <div className="flex-1">
          <p className="text-[11.5px] font-bold tracking-wide uppercase opacity-70">
            Mais recente
          </p>
          <h2 className="mt-1 text-base">{c.titulo}</h2>
          <p className="mt-1 text-[12.5px]">
            {c.numero} · {dataLonga(c.data)}
          </p>
          {c.resumo && <p className="mt-2 text-[12.5px]">{c.resumo}</p>}

          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-azul rounded-portal mt-4 inline-block px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:text-white hover:no-underline hover:opacity-90"
            >
              Abrir circular
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/** Lista compacta das demais circulares. */
export function ListaCirculares({ circulares }: { circulares: Circular[] }) {
  return (
    <ul className="bg-superficie shadow-portal rounded-portal overflow-hidden">
      {circulares.map((c) => {
        const href = urlDaCircular(c);

        return (
          <li key={c.id} className="border-cinza border-b last:border-b-0">
            <a
              href={href ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 no-underline hover:no-underline"
            >
              <span className="text-azul flex-1 text-[13px] font-bold">{c.titulo}</span>
              <span className="text-[12px] opacity-75">
                {c.numero} · {dataLonga(c.data)}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
