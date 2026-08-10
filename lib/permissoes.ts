import "server-only";

import { redirect } from "next/navigation";

import { AREAS_CMS } from "@/lib/areas";
import { usuarioAtual } from "@/lib/supabase/servidor";
import type { PortalArea } from "@/lib/tipos-banco";

export type Sessao = NonNullable<Awaited<ReturnType<typeof usuarioAtual>>>;

/** Admin pode tudo; editor só as áreas atribuídas. */
export function podeEditar(sessao: Sessao, area: PortalArea): boolean {
  if (sessao.perfil.papel === "admin") return true;
  return sessao.areas.includes(area);
}

/**
 * Sessão de quem está logado, ou redireciona para o login.
 * Perfil inativo conta como não logado — quem não foi convidado não entra.
 */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await usuarioAtual();
  if (!sessao) redirect("/admin/login");
  return sessao;
}

/**
 * Sessão com permissão na área, ou manda para o painel.
 *
 * Isto é conveniência de navegação. A **garantia** de que ninguém escreve o que
 * não pode é a RLS no banco — mesmo que alguém chame a Server Action na mão, o
 * Postgres recusa. Ver supabase/migrations/*_rls.sql.
 */
export async function exigirArea(area: PortalArea): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (!podeEditar(sessao, area)) redirect("/admin?erro=sem-permissao");
  return sessao;
}

/** Áreas que este usuário vê no menu do CMS. */
export function areasVisiveis(sessao: Sessao) {
  return AREAS_CMS.filter((a) => podeEditar(sessao, a.area));
}
