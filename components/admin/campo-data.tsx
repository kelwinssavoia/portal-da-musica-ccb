"use client";

import { useState } from "react";

/**
 * Campo de data e de hora.
 *
 * Existe porque o `<input type="date">` **não tem placeholder estilizável**: o
 * navegador desenha `dd/mm/aaaa` usando a cor do texto do campo. Com a cor azul
 * dos outros campos, essa máscara parecia um valor já preenchido — e alguém
 * salvaria pensando que a data estava lá.
 *
 * Aqui a cor acompanha o estado: máscara em cinza de placeholder quando vazio,
 * azul quando há valor de verdade. Nada de atributo `placeholder`, que os
 * navegadores ignoram nesses campos.
 *
 * Use este componente sempre — `Texto` não aceita mais `tipo="date"` nem
 * `tipo="time"`, para ninguém reintroduzir o problema sem perceber.
 */
export function CampoData({
  nome,
  rotulo,
  tipo = "date",
  valor,
  obrigatorio,
  ajuda,
  rotuloOculto,
  className = "",
}: {
  nome: string;
  rotulo: string;
  tipo?: "date" | "time";
  valor?: string | null;
  obrigatorio?: boolean;
  ajuda?: string;
  /** Para campo em linha, onde o rótulo já está visível ao lado. */
  rotuloOculto?: boolean;
  className?: string;
}) {
  const inicial = valor ?? "";
  const [preenchido, setPreenchido] = useState(inicial !== "");

  const cor = preenchido ? "mascara-cheia" : "mascara-vazia";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={nome}
        className={
          rotuloOculto ? "sr-only" : "text-azul text-[12.5px] font-bold"
        }
      >
        {rotulo}
        {obrigatorio && !rotuloOculto && <span className="text-vermelho"> *</span>}
      </label>

      <input
        id={nome}
        name={nome}
        type={tipo}
        required={obrigatorio}
        defaultValue={inicial}
        onChange={(e) => setPreenchido(e.target.value !== "")}
        className={`border-cinza rounded-portal w-full border bg-white px-3 py-2 text-[13px] ${cor}`}
      />

      {ajuda && <span className="text-[11.5px] opacity-70">{ajuda}</span>}
    </div>
  );
}

/** Atalho para hora, que é o caso mais comum no portal. */
export function CampoHora(props: Omit<Parameters<typeof CampoData>[0], "tipo">) {
  return <CampoData {...props} tipo="time" />;
}

/** `"19:30:00"` do banco → `"19:30"`, que é o que o input aceita. */
export function horaParaInput(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : "";
}
