import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, SEM_CONFIG } from "@/lib/supabase/config";
import type { Database } from "@/lib/tipos-banco";

/**
 * Cliente com sessão, para o CMS (`/admin`) e para as Server Actions.
 * Lê e grava os cookies de autenticação do Supabase.
 */
export async function clienteServidor() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new Error(SEM_CONFIG);

  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          for (const { name, value, options } of cookiesParaGravar) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component não pode gravar cookie. Tudo bem: o middleware
          // renova a sessão antes de a página renderizar.
        }
      },
    },
  });
}

/** Usuário autenticado e seu perfil, ou `null`. Base das telas do CMS. */
export async function usuarioAtual() {
  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, nome, email, papel, ativo")
    .eq("id", user.id)
    .single();

  if (!perfil?.ativo) return null;

  const { data: areas } = await supabase
    .from("perfil_areas")
    .select("area")
    .eq("perfil_id", user.id);

  return { perfil, areas: (areas ?? []).map((a) => a.area) };
}
