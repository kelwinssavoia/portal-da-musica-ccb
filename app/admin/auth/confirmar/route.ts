import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Volta do link mágico do e-mail e transforma o token numa sessão.
 *
 * Trata as duas formas que o Supabase pode usar, porque depende de como o
 * template de e-mail do projeto está configurado:
 *
 * - `?code=` — fluxo PKCE, trocado por `exchangeCodeForSession`
 * - `?token_hash=&type=` — template com `{{ .TokenHash }}`, via `verifyOtp`
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Só caminho interno: evita virar redirecionador aberto para outro site.
  const pedido = searchParams.get("destino") ?? "/admin";
  const destino = pedido.startsWith("/admin") ? pedido : "/admin";

  const supabase = await clienteServidor();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destino, origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(destino, origin));
  }

  return NextResponse.redirect(new URL("/admin/login?erro=link-invalido", origin));
}
