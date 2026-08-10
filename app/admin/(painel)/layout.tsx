import Link from "next/link";

import { MenuAdmin } from "@/components/admin/menu-admin";
import { getAjustes } from "@/lib/ajustes";
import { areasVisiveis, exigirSessao } from "@/lib/permissoes";

/**
 * Nada sob o painel é pré-renderizável: toda tela depende da sessão do usuário
 * (cookies) e mostra dados que só existem em tempo de requisição. `instant`
 * desligado diz isso ao Next em vez de ele acusar cada página.
 */
export const instant = false;

export default async function PainelLayout({ children }: LayoutProps<"/admin">) {
  const sessao = await exigirSessao();
  const { titulo, regiao } = await getAjustes();
  const areas = areasVisiveis(sessao);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-azul-escuro text-white">
        <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <Link href="/admin" className="text-[15px] font-bold text-white no-underline">
              {titulo} — manutenção
            </Link>
            <p className="text-[11.5px] opacity-70">{regiao}</p>
          </div>

          <div className="flex items-center gap-3 text-[12px]">
            <span className="opacity-85">
              {sessao.perfil.nome || sessao.perfil.email}
              {sessao.perfil.papel === "admin" && " · admin"}
            </span>
            <Link href="/" className="text-white underline">
              Ver portal
            </Link>
            <form action="/admin/auth/sair" method="post">
              <button type="submit" className="text-white underline">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <MenuAdmin areas={areas} />

      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-7">{children}</main>
    </div>
  );
}
