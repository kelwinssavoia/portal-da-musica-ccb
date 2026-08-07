import type { MetadataRoute } from "next";

import { getAjustes, siteUrl } from "@/lib/ajustes";

/**
 * O portal é indexável por padrão (docs/ARQUITETURA.md §8.1). A regional muda
 * isso no ajuste `indexavel` — sem tocar em código.
 * `/admin` fica fora dos buscadores em qualquer configuração.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { indexavel } = await getAjustes();

  return {
    rules: indexavel
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/buscar"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: indexavel ? `${siteUrl()}/sitemap.xml` : undefined,
  };
}
