import { Cabecalho } from "@/components/site/cabecalho";
import { FaixaInstitucional } from "@/components/site/faixa-institucional";
import { MenuPrincipal } from "@/components/site/menu-principal";
import { Rodape } from "@/components/site/rodape";

/** Moldura de todas as áreas públicas do portal. */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <FaixaInstitucional />
      <Cabecalho />
      <MenuPrincipal />
      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-8">{children}</main>
      <Rodape />
    </div>
  );
}
