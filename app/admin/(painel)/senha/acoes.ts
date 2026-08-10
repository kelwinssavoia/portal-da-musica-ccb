"use server";

import { z } from "zod";

import type { Resultado } from "@/lib/acoes";
import { SENHA_MINIMA } from "@/lib/senha";
import { exigirSessao } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

const esquema = z
  .object({
    senha: z.string().min(SENHA_MINIMA, `a senha precisa ter ao menos ${SENHA_MINIMA} caracteres`),
    confirmacao: z.string(),
  })
  .refine((v) => v.senha === v.confirmacao, {
    message: "as duas senhas não são iguais",
    path: ["confirmacao"],
  });

/** Troca a própria senha. Qualquer usuário ativo pode. */
export async function trocarSenha(_: unknown, dados: FormData): Promise<Resultado> {
  await exigirSessao();

  const analise = esquema.safeParse(Object.fromEntries(dados));
  if (!analise.success) return { ok: false, erro: analise.error.issues[0].message };

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.updateUser({ password: analise.data.senha });

  if (error) {
    console.error("[cms] falha ao trocar senha:", error);
    return { ok: false, erro: "Não foi possível trocar a senha. Tente de novo." };
  }

  return { ok: true, aviso: "Senha trocada. Use a nova na próxima vez que entrar." };
}
