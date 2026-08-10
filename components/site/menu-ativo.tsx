"use client";

import { usePathname } from "next/navigation";

import { MenuBase } from "@/components/site/menu-base";

/** Versão hidratada: sabe a rota atual e sublinha a área ativa. */
export function MenuAtivo() {
  return <MenuBase pathname={usePathname()} />;
}
