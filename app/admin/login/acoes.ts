"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clienteServidor } from "@/lib/supabase/servidor";

export type ResultadoLogin = { erro: string } | null;

const esquema = z.object({
  email: z.string().trim().min(1, "informe o e-mail"),
  senha: z.string().min(1, "informe a senha"),
  destino: z.string().optional(),
});

/**
 * Entra com e-mail e senha.
 *
 * Roda no servidor de propósito: é ele que grava os cookies de sessão, em vez de
 * o navegador guardar o token. O formulário em si depende de JavaScript, como
 * todo Server Action.
 */
export async function entrar(_: ResultadoLogin, dados: FormData): Promise<ResultadoLogin> {
  const analise = esquema.safeParse(Object.fromEntries(dados));
  if (!analise.success) return { erro: "Informe e-mail e senha." };

  const { email, senha, destino } = analise.data;
  const supabase = await clienteServidor();

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    // Mensagem única para e-mail inexistente e senha errada: dizer qual dos dois
    // falhou entrega a quem tenta adivinhar quais e-mails têm acesso.
    return { erro: "E-mail ou senha incorretos." };
  }

  // Perfil inativo é o mesmo que sem acesso — encerra a sessão em vez de deixar
  // a pessoa presa numa área vazia.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("ativo")
    .eq("id", user!.id)
    .maybeSingle();

  if (!perfil?.ativo) {
    await supabase.auth.signOut();
    return { erro: "Seu acesso está bloqueado. Fale com um administrador do portal." };
  }

  redirect(destino?.startsWith("/admin") ? destino : "/admin");
}
