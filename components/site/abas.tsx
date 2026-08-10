import Link from "next/link";

/**
 * Alternância de visão feita com links, não com estado: a visão fica na URL
 * (compartilhável) e funciona sem JavaScript.
 */
export function Abas({
  opcoes,
  atual,
  base,
  param,
}: {
  opcoes: { valor: string; nome: string }[];
  atual: string;
  base: string;
  param: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {opcoes.map((o) => {
        const ativa = o.valor === atual;
        return (
          <Link
            key={o.valor}
            href={`${base}?${param}=${o.valor}`}
            role="tab"
            aria-selected={ativa}
            className={`border-cinza rounded-portal border px-3 py-1.5 text-[12.5px] font-bold no-underline hover:no-underline ${
              ativa ? "bg-azul text-white" : "bg-superficie text-azul"
            }`}
          >
            {o.nome}
          </Link>
        );
      })}
    </div>
  );
}
