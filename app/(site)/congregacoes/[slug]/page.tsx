import { notFound } from "next/navigation";

import { DetalheCongregacao } from "@/components/site/detalhe-congregacao";
import { buscarCongregacao, listarCongregacoes } from "@/lib/dados/congregacoes";
import { diaEHora, padraoEnsaio } from "@/lib/datas";

export async function generateStaticParams() {
  const congregacoes = await listarCongregacoes();
  return congregacoes.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/congregacoes/[slug]">) {
  const { slug } = await params;
  const c = await buscarCongregacao(slug);
  if (!c) return { title: "Congregação não encontrada" };

  const partes = [
    c.endereco,
    diaEHora(c.culto_dow, c.culto_hora) && `Culto: ${diaEHora(c.culto_dow, c.culto_hora)}`,
    padraoEnsaio(c.ensaio_ord, c.ensaio_dow, c.ensaio_hora) &&
      `Ensaio: ${padraoEnsaio(c.ensaio_ord, c.ensaio_dow, c.ensaio_hora)}`,
  ].filter(Boolean);

  return { title: c.nome, description: partes.join(" · ") };
}

export default async function PaginaCongregacao({ params }: PageProps<"/congregacoes/[slug]">) {
  const { slug } = await params;
  const congregacao = await buscarCongregacao(slug);
  if (!congregacao) notFound();

  return (
    <div className="bg-superficie shadow-portal rounded-portal mx-auto max-w-[640px] overflow-hidden">
      <DetalheCongregacao congregacao={congregacao} />
    </div>
  );
}
