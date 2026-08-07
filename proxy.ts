import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Renova a sessão do Supabase e barra `/admin` para quem não está autenticado.
 *
 * Isto é conveniência de navegação — quem não tem permissão é mandado para o
 * login em vez de ver uma tela vazia. A **garantia** de que ninguém edita o que
 * não pode é a RLS no banco (supabase/migrations/*_rls.sql).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sem Supabase configurado não há sessão para renovar; deixa passar para que
  // o portal continue subindo e a tela explique o que falta.
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar) {
        for (const { name, value } of cookiesParaGravar) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaGravar) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() valida o token no servidor — não confiar em getSession() aqui.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const ehLogin = pathname.startsWith("/admin/login");

  if (!user && pathname.startsWith("/admin") && !ehLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("destino", pathname);
    return NextResponse.redirect(url);
  }

  if (user && ehLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
