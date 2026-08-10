"use client";

import { usePathname } from "next/navigation";

import { MenuAdminBase, type ItemMenu } from "@/components/admin/menu-admin";

export function MenuAdminAtivo({ areas }: { areas: ItemMenu[] }) {
  return <MenuAdminBase areas={areas} pathname={usePathname()} />;
}
