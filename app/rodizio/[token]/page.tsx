import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RodizioPublico } from "@/components/site/rodizio-publico";
import { buscarRodizioPublico } from "@/lib/dados/rodizios";
import { periodoEmTexto } from "@/lib/datas";

/**
 * Rodízio de organistas aberto pelo link do grupo.
 *
 * Tem nome de irmã, então fica fora dos buscadores em qualquer configuração do
 * portal — e não entra no sitemap nem em menu. Quem não tem o link não chega
 * aqui: o token é aleatório.
 */
const FORA_DOS_BUSCADORES = { index: false, follow: false } as const;

export async function generateMetadata({
  params,
}: PageProps<"/rodizio/[token]">): Promise<Metadata> {
  const { token } = await params;
  const r = await buscarRodizioPublico(token);
  if (!r) return { title: "Rodízio não encontrado", robots: FORA_DOS_BUSCADORES };

  return {
    title: `Rodízio de organistas — ${r.congregacao.nome}`,
    description: periodoEmTexto(r.inicio, r.fim),
    robots: FORA_DOS_BUSCADORES,
  };
}

export default async function PaginaRodizio({ params }: PageProps<"/rodizio/[token]">) {
  const { token } = await params;
  const rodizio = await buscarRodizioPublico(token);
  if (!rodizio) notFound();

  return <RodizioPublico rodizio={rodizio} />;
}
