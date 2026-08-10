"use client";

import { useState } from "react";

import { clienteNavegador } from "@/lib/supabase/navegador";

/**
 * Login por link mágico: sem senha para criar, esquecer ou reaproveitar.
 *
 * O envio acontece no navegador porque é o cliente do Supabase que guarda o
 * verificador PKCE — o mesmo navegador precisa completar o login.
 */
export function FormLogin({ destino }: { destino: string }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"parado" | "enviando" | "enviado">("parado");
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    setErro(null);

    try {
      const supabase = clienteNavegador();
      const url = new URL("/admin/auth/confirmar", window.location.origin);
      url.searchParams.set("destino", destino);

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: url.toString(), shouldCreateUser: false },
      });

      if (error) throw error;
      setEstado("enviado");
    } catch (falha) {
      console.error("[login] falha ao enviar link mágico:", falha);
      // Mensagem genérica de propósito: não revelar se o e-mail existe.
      setErro(
        "Não foi possível enviar o link agora. Confirme o e-mail e tente de novo em alguns instantes.",
      );
      setEstado("parado");
    }
  }

  if (estado === "enviado") {
    return (
      <div className="border-verde bg-verde/5 rounded-r-portal border-l-4 p-4">
        <p className="text-azul text-[13px] font-bold">Link enviado</p>
        <p className="mt-1 text-[12.5px]">
          Abra o e-mail que acabou de chegar em <strong>{email}</strong> e clique no link para
          entrar. O link vale por pouco tempo e só funciona neste navegador.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-azul text-[12.5px] font-bold">Seu e-mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-cinza rounded-portal text-azul border bg-white px-3 py-2 text-[13px]"
        />
      </label>

      {erro && <p className="text-vermelho text-[12.5px]">{erro}</p>}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="bg-azul rounded-portal px-4 py-2 text-[12.5px] font-bold text-white disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando…" : "Receber link de acesso"}
      </button>

      <p className="text-[11.5px] opacity-70">
        O acesso é só para quem foi convidado pela secretaria. Não há cadastro aberto.
      </p>
    </form>
  );
}
