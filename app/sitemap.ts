import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/ajustes";
import { listarCongregacoes } from "@/lib/dados/congregacoes";
import { AREAS } from "@/lib/navegacao";

/** Áreas do portal mais uma entrada por congregação. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const congregacoes = await listarCongregacoes();

  return [
    ...AREAS.map((area) => ({
      url: area.href === "/" ? base : `${base}${area.href}`,
      changeFrequency: "weekly" as const,
      priority: area.href === "/" ? 1 : 0.8,
    })),
    ...congregacoes.map((c) => ({
      url: `${base}/congregacoes/${c.slug}`,
      lastModified: new Date(c.atualizado_em),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
