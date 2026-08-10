"use server";

import { z } from "zod";

import { acao, textoObrigatorio, textoOpcional, type Resultado } from "@/lib/acoes";
import { siteUrl } from "@/lib/ajustes";
import { AREAS_CMS } from "@/lib/areas";
import { clienteAdmin } from "@/lib/supabase/admin";
import type { PortalArea } from "@/lib/tipos-banco";

const AREAS_VALIDAS = AREAS_CMS.map((a) => a.area);

/** Áreas marcadas no formulário, como `area_congregacoes`. */
function areasDoFormulario(dados: FormData): PortalArea[] {
  return AREAS_VALIDAS.filter((a) => dados.get(`area_${a}`) === "sim");
}

const esquemaConvite = z.object({
  email: z.string().email({ message: "informe um e-mail válido" }),
  nome: textoOpcional,
  papel: z.enum(["admin", "editor"]),
});

/**
 * Convida um irmão para manter o portal.
 *
 * Usa a chave secreta (única operação do portal que precisa dela), porque criar
 * usuário é API de administração do Auth. Roda só no servidor.
 */
export async function convidarUsuario(_: unknown, dados: FormData): Promise<Resultado> {
  const areas = areasDoFormulario(dados);

  return acao("usuarios", esquemaConvite, dados, async (v, supabase) => {
    if (v.papel === "editor" && areas.length === 0) {
      throw new Error("Escolha ao menos uma área para o editor, senão ele entra e não edita nada.");
    }

    const admin = clienteAdmin();

    const { data, error } = await admin.auth.admin.inviteUserByEmail(v.email, {
      redirectTo: `${siteUrl()}/admin/auth/confirmar`,
      data: v.nome ? { nome: v.nome } : undefined,
    });

    if (error) throw error;
    const id = data.user?.id;
    if (!id) throw new Error("O convite foi criado, mas o usuário não voltou. Tente de novo.");

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

    // `supabase` (com RLS) não é usado aqui de propósito: convite exige a API
    // de administração. A permissão de quem convida foi conferida por acao().
    void supabase;

    return `Convite enviado para ${v.email}. Ele entra pelo link do e-mail.`;
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

      const admin = clienteAdmin();
      const { error } = await admin.auth.admin.deleteUser(v.id);
      if (error) throw error;

      return "Acesso removido.";
    },
  );
}
