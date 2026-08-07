import { IconeBusca } from "@/components/icones";

/**
 * Busca global. Form GET puro: funciona sem JavaScript e a consulta fica na
 * URL (`/buscar?q=`), então o resultado é compartilhável.
 */
export function CampoBusca() {
  return (
    <form
      action="/buscar"
      role="search"
      className="border-texto bg-superficie shadow-portal flex max-w-[360px] flex-1 basis-[260px] items-center gap-2 rounded-[13px] border px-3 py-[7px]"
    >
      <IconeBusca className="text-texto size-[15px] shrink-0" />
      <input
        type="search"
        name="q"
        autoComplete="off"
        placeholder="Buscar em todo o portal"
        aria-label="Buscar em todo o portal"
        className="text-azul w-full border-none bg-transparent text-[13.5px] outline-none"
      />
    </form>
  );
}
