"use client";

import { useEffect } from "react";

import { Botao } from "@/components/admin/campos";

/**
 * Abre a janela de impressão assim que a página carrega. Nela dá para mandar
 * para a impressora ou escolher "Salvar como PDF" — o navegador gera o PDF, sem
 * biblioteca nem servidor.
 */
export function Imprimir() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Botao type="button" onClick={() => window.print()}>
      Imprimir / salvar PDF
    </Botao>
  );
}
