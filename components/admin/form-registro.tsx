"use client";

import { useActionState } from "react";

import { Botao } from "@/components/admin/campos";
import type { Resultado } from "@/lib/acoes";

type Estado = Resultado | null;

/**
 * Formulário de registro do CMS.
 *
 * Usa `useActionState`, então mostra o resultado da Server Action sem
 * recarregar. Sem JavaScript o `<form action>` ainda envia e a página recarrega
 * com o dado salvo — só não mostra a mensagem de confirmação.
 */
export function FormRegistro({
  acao,
  children,
  rotuloSalvar = "Salvar",
  aoLado,
}: {
  acao: (estado: Estado, dados: FormData) => Promise<Resultado>;
  children: React.ReactNode;
  rotuloSalvar?: string;
  aoLado?: React.ReactNode;
}) {
  const [estado, enviar, pendente] = useActionState(acao, null);

  return (
    <form action={enviar} className="flex flex-col gap-4">
      {children}

      {estado && !estado.ok && (
        <p className="border-vermelho bg-vermelho/5 rounded-r-portal border-l-4 p-3 text-[12.5px]">
          {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p className="border-verde bg-verde/5 rounded-r-portal border-l-4 p-3 text-[12.5px]">
          {estado.aviso ?? "Salvo. O portal já está atualizado."}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Botao type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : rotuloSalvar}
        </Botao>
        {aoLado}
      </div>
    </form>
  );
}

/** Botão de excluir, com confirmação do navegador. */
export function FormExcluir({
  acao,
  id,
  rotulo = "Excluir",
  pergunta = "Excluir este registro? Não dá para desfazer.",
}: {
  acao: (estado: Estado, dados: FormData) => Promise<Resultado>;
  id: string;
  rotulo?: string;
  pergunta?: string;
}) {
  const [estado, enviar, pendente] = useActionState(acao, null);

  return (
    <form
      action={enviar}
      onSubmit={(e) => {
        if (!confirm(pergunta)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Botao type="submit" variante="perigo" disabled={pendente}>
        {pendente ? "Excluindo…" : rotulo}
      </Botao>
      {estado && !estado.ok && (
        <span className="text-vermelho ml-2 text-[12px]">{estado.erro}</span>
      )}
    </form>
  );
}
