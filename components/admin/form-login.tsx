"use client";

import { useActionState } from "react";

import { Botao, Texto } from "@/components/admin/campos";
import { entrar } from "@/app/admin/login/acoes";

/** Login com e-mail e senha. Sem e-mail no caminho, sem link para esperar. */
export function FormLogin({ destino }: { destino: string }) {
  const [estado, enviar, pendente] = useActionState(entrar, null);

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <input type="hidden" name="destino" value={destino} />

      <Texto nome="email" rotulo="E-mail" tipo="email" obrigatorio autoComplete="username" />
      <Texto
        nome="senha"
        rotulo="Senha"
        tipo="password"
        obrigatorio
        autoComplete="current-password"
      />

      {estado?.erro && (
        <p className="border-vermelho bg-vermelho/5 rounded-r-portal border-l-4 p-3 text-[12.5px]">
          {estado.erro}
        </p>
      )}

      <Botao type="submit" disabled={pendente}>
        {pendente ? "Entrando…" : "Entrar"}
      </Botao>

      <p className="text-[11.5px] opacity-70">
        O acesso é só para quem foi cadastrado pela secretaria. Esqueceu a senha? Um administrador
        do portal define uma nova para você.
      </p>
    </form>
  );
}
