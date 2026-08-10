import { Suspense } from "react";
import { notFound } from "next/navigation";

import { DetalheCongregacao } from "@/components/site/detalhe-congregacao";
import { Modal } from "@/components/site/modal";
import { buscarCongregacao } from "@/lib/dados/congregacoes";

/**
 * Detalhe da congregação interceptado como modal sobre a grade.
 *
 * A moldura do modal aparece na hora do clique; o conteúdo chega em seguida.
 * Por isso a leitura de `params` fica dentro do `<Suspense>` — sem isso a rota
 * inteira deixaria de ser pré-renderizável.
 */
export default function ModalCongregacao({ params }: PageProps<"/congregacoes/[slug]">) {
  return (
    <Modal rotulo="Detalhes da congregação">
      <Suspense fallback={<Carregando />}>
        <Conteudo params={params} />
      </Suspense>
    </Modal>
  );
}

async function Conteudo({ params }: { params: PageProps<"/congregacoes/[slug]">["params"] }) {
  const { slug } = await params;
  const congregacao = await buscarCongregacao(slug);
  if (!congregacao) notFound();

  return <DetalheCongregacao congregacao={congregacao} />;
}

function Carregando() {
  return (
    <div className="p-8">
      <div className="bg-cinza h-40 w-full animate-pulse rounded-portal" />
      <p className="mt-4 text-center text-[12.5px]">Carregando…</p>
    </div>
  );
}
