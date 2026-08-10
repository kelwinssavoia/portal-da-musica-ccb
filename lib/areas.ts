import type { PortalArea } from "@/lib/tipos-banco";

/**
 * Áreas do CMS, com nome e rota.
 *
 * Fica separado de `lib/permissoes.ts` porque aquele módulo é `server-only` (usa
 * cookies e redirect) e esta lista é dado puro, usado também nos formulários,
 * que rodam no navegador.
 */
export const AREAS_CMS: { area: PortalArea; nome: string; href: string }[] = [
  { area: "congregacoes", nome: "Congregações", href: "/admin/congregacoes" },
  { area: "eventos", nome: "Eventos", href: "/admin/eventos" },
  { area: "circulares", nome: "Circulares", href: "/admin/circulares" },
  { area: "arquivos", nome: "Arquivos", href: "/admin/arquivos" },
  { area: "duvidas", nome: "Dúvidas", href: "/admin/duvidas" },
  { area: "ajustes", nome: "Ajustes", href: "/admin/ajustes" },
  { area: "usuarios", nome: "Usuários", href: "/admin/usuarios" },
];
