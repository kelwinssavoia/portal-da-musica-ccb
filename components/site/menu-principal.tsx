import { Suspense } from "react";

import { MenuAtivo } from "@/components/site/menu-ativo";
import { MenuBase } from "@/components/site/menu-base";

/**
 * Menu sticky das áreas. O fallback já mostra o menu inteiro e navegável —
 * só sem o sublinhado da área ativa, que depende da rota atual.
 */
export function MenuPrincipal() {
  return (
    <Suspense fallback={<MenuBase pathname="" />}>
      <MenuAtivo />
    </Suspense>
  );
}
