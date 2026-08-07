import type { Metadata } from "next";

import { getAjustes, siteUrl } from "@/lib/ajustes";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { titulo, subtitulo, heroTexto, indexavel } = await getAjustes();

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${titulo} · ${subtitulo}`, template: `%s · ${titulo}` },
    description: heroTexto,
    // Ver docs/ARQUITETURA.md §8.1 — decisão de divulgação, não de segurança.
    robots: indexavel ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: titulo,
      title: `${titulo} · ${subtitulo}`,
      description: heroTexto,
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
