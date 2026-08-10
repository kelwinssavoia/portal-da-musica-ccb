"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Modal do detalhe interceptado. Usa `<dialog>` nativo, que já entrega foco
 * preso, fechar no Esc e leitura correta por leitor de tela.
 *
 * Fechar volta no histórico, devolvendo a URL para /congregacoes.
 */
export function Modal({ children, rotulo }: { children: React.ReactNode; rotulo: string }) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogo.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-label={rotulo}
      onClose={() => router.back()}
      onClick={(e) => {
        // Clique no fundo (fora do conteúdo) fecha.
        if (e.target === dialogo.current) dialogo.current?.close();
      }}
      className="bg-superficie shadow-portal rounded-portal m-auto w-[calc(100%-2rem)] max-w-[640px] overflow-hidden backdrop:bg-black/50"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => dialogo.current?.close()}
          aria-label="Fechar"
          className="text-azul absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full bg-white/90 text-lg leading-none font-bold shadow"
        >
          ×
        </button>
        {children}
      </div>
    </dialog>
  );
}
