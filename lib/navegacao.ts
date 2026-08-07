/** Áreas do portal público. Fonte única para o menu e para o sitemap. */
export const AREAS = [
  { href: "/", nome: "Início" },
  { href: "/congregacoes", nome: "Congregações" },
  { href: "/ensaios", nome: "Ensaios" },
  { href: "/calendario", nome: "Calendário" },
  { href: "/circulares", nome: "Circulares" },
  { href: "/secretaria", nome: "Secretaria" },
] as const;

export type Area = (typeof AREAS)[number];

/** Uma área está ativa na rota atual? "/" só casa exato; as demais casam prefixo. */
export function areaAtiva(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
