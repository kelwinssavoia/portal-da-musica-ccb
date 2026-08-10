"use client";

import { Texto } from "@/components/admin/campos";
import { FormRegistro } from "@/components/admin/form-registro";
import { trocarSenha } from "@/app/admin/(painel)/senha/acoes";
import { SENHA_MINIMA } from "@/lib/senha";

export function FormSenha() {
  return (
    <FormRegistro acao={trocarSenha} rotuloSalvar="Trocar senha">
      <Texto
        nome="senha"
        rotulo="Nova senha"
        tipo="password"
        obrigatorio
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
        ajuda={`Ao menos ${SENHA_MINIMA} caracteres.`}
      />
      <Texto
        nome="confirmacao"
        rotulo="Repita a nova senha"
        tipo="password"
        obrigatorio
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
      />
    </FormRegistro>
  );
}
