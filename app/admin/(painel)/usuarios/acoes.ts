"use server";

import { z } from "zod";

import { acao, textoObrigatorio, textoOpcional, type Resultado } from "@/lib/acoes";
import { AREAS_CMS } from "@/lib/areas";
import { SENHA_MINIMA, senhaTemporaria } from "@/lib/senha";
import { clienteAdmin } from "@/lib/supabase/admin";
import type { PortalArea } from "@/lib/tipos-banco";

const AREAS_VALIDAS = AREAS_CMS.map((a) => a.area);

/** Áreas marcadas no formulário, como `area_congregacoes`. */
function areasDoFormulario(dados: FormData): PortalArea[] {
  return AREAS_VALIDAS.filter((a) => dados.get(`area_${a}`) === "sim");
}

const esquemaCriar = z.object({
  email: z.string().trim().email({ message: "informe um e-mail válido" }),
  nome: textoOpcional,
  papel: z.enum(["admin", "editor"]),
  senha: z
    .string()
    .optional()
    .transform((s) => (s ?? "").trim())
    .refine((s) => s === "" || s.length >= SENHA_MINIMA, {
      message: `a senha precisa ter ao menos ${SENHA_MINIMA} caracteres`,
    }),
});

/**
 * Cria um acesso ao CMS com e-mail e senha.
 *
 * Nenhum e-mail é enviado: o portal não depende de serviço de e-mail. Quem cria
 * passa a senha provisória pelo canal que já usa com a secretaria, e a pessoa
 * troca em /admin/senha.
 */
export async function criarAcesso(_: unknown, dados: FormData): Promise<Resultado> {
  const areas = areasDoFormulario(dados);

  return acao("usuarios", esquemaCriar, dados, async (v) => {
    if (v.papel === "editor" && areas.length === 0) {
      throw new Error("Escolha ao menos uma área para o editor, senão ele entra e não edita nada.");
    }

    const senha = v.senha === "" ? senhaTemporaria() : v.senha;
    const admin = clienteAdmin();

    // `email_confirm: true` porque não há e-mail de confirmação para clicar.
    const { data, error } = await admin.auth.admin.createUser({
      email: v.email,
      password: senha,
      email_confirm: true,
      user_metadata: v.nome ? { nome: v.nome } : undefined,
    });

    if (error) throw error;
    const id = data.user?.id;
    if (!id) throw new Error("O acesso não foi criado. Tente de novo.");

    // O trigger cria o perfil inativo; aqui ele é liberado com o papel escolhido.
    const { error: erroPerfil } = await admin
      .from("perfis")
      .upsert(
        { id, email: v.email, nome: v.nome ?? "", papel: v.papel, ativo: true },
        { onConflict: "id" },
      );
    if (erroPerfil) throw erroPerfil;

    if (v.papel === "editor") {
      const { error: erroAreas } = await admin
        .from("perfil_areas")
        .insert(areas.map((area) => ({ perfil_id: id, area })));
      if (erroAreas) throw erroAreas;
    }

    return `Acesso criado para ${v.email}. Senha provisória: ${senha} — passe para a pessoa e peça que troque em "Minha senha".`;
  });
}

const esquemaSenha = z.object({
  id: textoObrigatorio("Usuário"),
  senha: z
    .string()
    .optional()
    .transform((s) => (s ?? "").trim())
    .refine((s) => s === "" || s.length >= SENHA_MINIMA, {
      message: `a senha precisa ter ao menos ${SENHA_MINIMA} caracteres`,
    }),
});

/** Define uma senha nova para outra pessoa. É o "esqueci minha senha" do portal. */
export async function definirSenha(_: unknown, dados: FormData): Promise<Resultado> {
  return acao("usuarios", esquemaSenha, dados, async (v) => {
    const senha = v.senha === "" ? senhaTemporaria() : v.senha;

    const { error } = await clienteAdmin().auth.admin.updateUserById(v.id, { password: senha });
    if (error) throw error;

    return `Senha redefinida. Nova senha provisória: ${senha} — passe para a pessoa e peça que troque em "Minha senha".`;
  });
}

const esquemaPermissoes = z.object({
  id: textoObrigatorio("Usuário"),
  papel: z.enum(["admin", "editor"]),
  ativo: z.union([z.literal("sim"), z.undefined(), z.literal("")]).transform((v) => v === "sim"),
});

export async function salvarPermissoes(_: unknown, dados: FormData): Promise<Resultado> {
  const areas = areasDoFormulario(dados);

  return acao("usuarios", esquemaPermissoes, dados, async (v, supabase) => {
    const { data: eu } = await supabase.auth.getUser();

    // Sem isto, um admin distraído se rebaixa e a regional pode ficar sem
    // ninguém que administra usuários.
    if (eu.user?.id === v.id && (v.papel !== "admin" || !v.ativo)) {
      throw new Error("Você não pode remover o próprio acesso de administrador.");
    }

    const admin = clienteAdmin();

    const { error } = await admin
      .from("perfis")
      .update({ papel: v.papel, ativo: v.ativo })
      .eq("id", v.id);
    if (error) throw error;

    const { error: erroApagar } = await admin.from("perfil_areas").delete().eq("perfil_id", v.id);
    if (erroApagar) throw erroApagar;

    if (v.papel === "editor" && areas.length > 0) {
      const { error: erroInserir } = await admin
        .from("perfil_areas")
        .insert(areas.map((area) => ({ perfil_id: v.id, area })));
      if (erroInserir) throw erroInserir;
    }
  });
}

export async function removerUsuario(_: unknown, dados: FormData): Promise<Resultado> {
  return acao(
    "usuarios",
    z.object({ id: textoObrigatorio("Usuário") }),
    dados,
    async (v, supabase) => {
      const { data: eu } = await supabase.auth.getUser();
      if (eu.user?.id === v.id) throw new Error("Você não pode remover a si mesmo.");

      const { error } = await clienteAdmin().auth.admin.deleteUser(v.id);
      if (error) throw error;

      return "Acesso removido.";
    },
  );
}
