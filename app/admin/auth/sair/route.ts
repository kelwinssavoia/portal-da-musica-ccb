import { NextResponse, type NextRequest } from "next/server";

import { clienteServidor } from "@/lib/supabase/servidor";

/** Encerra a sessão. POST de propósito: sair não deve acontecer por link. */
export async function POST(request: NextRequest) {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/admin/login", request.nextUrl.origin));
}
