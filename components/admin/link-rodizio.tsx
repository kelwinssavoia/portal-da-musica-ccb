"use client";

import { useState } from "react";

import { Botao } from "@/components/admin/campos";

/**
 * Link público do rodízio, com atalho para copiar e para mandar no WhatsApp.
 * Quem abre escolhe o próprio nome uma vez; o navegador lembra nas próximas.
 */
export function LinkRodizio({ url, comum }: { url: string; comum: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      prompt("Copie o link:", url);
    }
  }

  const mensagem = `Rodízio de organistas — ${comum}\n${url}`;

  return (
    <div className="flex flex-col gap-2">
      <input
        readOnly
        value={url}
        aria-label="Link público do rodízio"
        onFocus={(e) => e.target.select()}
        className="border-cinza rounded-portal text-azul w-full border bg-white px-3 py-2 text-[12.5px]"
      />
      <div className="flex flex-wrap gap-2">
        <Botao type="button" variante="secundario" onClick={copiar}>
          {copiado ? "Copiado!" : "Copiar link"}
        </Botao>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
          target="_blank"
          rel="noreferrer"
          className="bg-verde rounded-portal px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:text-white hover:no-underline"
        >
          Enviar no WhatsApp
        </a>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-azul self-center text-[12.5px]"
        >
          Abrir →
        </a>
      </div>
    </div>
  );
}
