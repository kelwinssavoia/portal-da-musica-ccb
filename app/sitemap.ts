import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/ajustes";
import { AREAS } from "@/lib/navegacao";

/**
 * Rotas públicas do portal. Na fase 3 passa a incluir também uma entrada por
 * congregação (`/congregacoes/[slug]`).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  return AREAS.map((area) => ({
    url: area.href === "/" ? base : `${base}${area.href}`,
    changeFrequency: "weekly",
    priority: area.href === "/" ? 1 : 0.8,
  }));
}
