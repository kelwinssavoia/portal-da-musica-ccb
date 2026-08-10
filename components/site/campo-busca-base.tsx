import { IconeBusca } from "@/components/icones";

/**
 * Campo de busca. Form GET puro: funciona sem JavaScript e a consulta fica na
 * URL (`/buscar?q=`), então o resultado é compartilhável.
 *
 * Não descobre o termo atual por conta própria — quem sabe disso é
 * `CampoBuscaComTermo`, porque `useSearchParams()` é dado de tempo de execução.
 */
export function CampoBuscaBase({ valor }: { valor: string }) {
  return (
    <form
      action="/buscar"
      role="search"
      className="border-texto bg-superficie shadow-portal flex max-w-[360px] flex-1 basis-[260px] items-center gap-2 rounded-[13px] border px-3 py-[7px]"
    >
      <IconeBusca className="text-texto size-[15px] shrink-0" />
      <input
        // Reassume o valor da URL a cada busca nova; sem isso o React manteria
        // o texto anterior depois de navegar.
        key={valor}
        type="search"
        name="q"
        defaultValue={valor}
        autoComplete="off"
        placeholder="Buscar em todo o portal"
        aria-label="Buscar em todo o portal"
        className="text-azul w-full border-none bg-transparent text-[13.5px] outline-none"
      />
    </form>
  );
}
