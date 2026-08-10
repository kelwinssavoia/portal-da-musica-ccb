import { Suspense } from "react";

import { CampoBuscaBase } from "@/components/site/campo-busca-base";
import { CampoBuscaComTermo } from "@/components/site/campo-busca-com-termo";

/** Busca global do cabeçalho. O fallback já é um campo funcional, só vazio. */
export function CampoBusca() {
  return (
    <Suspense fallback={<CampoBuscaBase valor="" />}>
      <CampoBuscaComTermo />
    </Suspense>
  );
}
