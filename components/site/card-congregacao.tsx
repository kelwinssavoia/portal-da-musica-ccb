import Link from "next/link";

import { FotoCongregacao } from "@/components/site/foto-congregacao";
import { cultosEmTexto, padraoEnsaio } from "@/lib/datas";
import type { ComumComCultos } from "@/lib/dados/congregacoes";

/** Card da grade de Congregações. O card inteiro é clicável. */
export function CardCongregacao({ congregacao: c }: { congregacao: ComumComCultos }) {
  const culto = cultosEmTexto(c.cultos);
  const ensaio = padraoEnsaio(c.ensaio_ord, c.ensaio_dow, c.ensaio_hora);

  return (
    <Link
      href={`/congregacoes/${c.slug}`}
      className="bg-superficie border-azul shadow-portal flex flex-col overflow-hidden rounded-r-portal border-l-4 no-underline hover:no-underline"
    >
      <FotoCongregacao caminho={c.foto_path} nome={c.nome} />

      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-base">{c.nome}</h2>
        <p className="mt-1 text-[12.5px]">{c.endereco}</p>

        <dl className="mt-3 flex flex-col gap-1 text-[12.5px]">
          {culto && (
            <div className="flex gap-1.5">
              <dt className="opacity-75">Cultos:</dt>
              <dd className="text-azul font-bold">{culto}</dd>
            </div>
          )}
          {ensaio && (
            <div className="flex gap-1.5">
              <dt className="opacity-75">Ensaio local:</dt>
              <dd className="text-azul font-bold">{ensaio}</dd>
            </div>
          )}
        </dl>

        <span className="text-azul mt-4 text-[12.5px] font-bold">Ver detalhes e rota →</span>
      </div>
    </Link>
  );
}
