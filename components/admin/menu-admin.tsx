import { Suspense } from "react";
import Link from "next/link";

import { MenuAdminAtivo } from "@/components/admin/menu-admin-ativo";

export type ItemMenu = { nome: string; href: string };

/** Menu do CMS. Mostra só as áreas que o usuário pode editar. */
export function MenuAdminBase({ areas, pathname }: { areas: ItemMenu[]; pathname: string }) {
  return (
    <nav aria-label="Áreas de manutenção" className="bg-superficie border-cinza border-b-2">
      <div className="mx-auto flex w-full max-w-[1040px] flex-wrap px-4">
        {areas.map((a) => {
          const ativa = pathname !== "" && pathname.startsWith(a.href);
          return (
            <Link
              key={a.href}
              href={a.href}
              aria-current={ativa ? "page" : undefined}
              className={`text-azul relative px-3 py-3 text-[12px] font-bold no-underline hover:no-underline ${
                ativa ? "" : "opacity-70"
              }`}
            >
              {a.nome}
              {ativa && (
                <span
                  aria-hidden="true"
                  className="bg-azul absolute right-3 bottom-0 left-3 h-0.5"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MenuAdmin({ areas }: { areas: ItemMenu[] }) {
  return (
    <Suspense fallback={<MenuAdminBase areas={areas} pathname="" />}>
      <MenuAdminAtivo areas={areas} />
    </Suspense>
  );
}
