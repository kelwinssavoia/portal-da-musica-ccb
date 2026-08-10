import { FotoCongregacao } from "@/components/site/foto-congregacao";
import { cultosEmTexto, frequenciaEnsaio, padraoEnsaio } from "@/lib/datas";
import { urlDoMapa, type ComumComCultos } from "@/lib/dados/congregacoes";
import { nomeDaCidade } from "@/lib/cidades";

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor) return null;
  return (
    <div className="border-cinza flex flex-wrap justify-between gap-2 border-b py-2 last:border-b-0">
      <span className="text-[12.5px] opacity-80">{rotulo}</span>
      <span className="text-azul text-[13px] font-bold">{valor}</span>
    </div>
  );
}

/**
 * Conteúdo do detalhe da congregação. Usado na página inteira e dentro do
 * modal — os dois mostram exatamente a mesma coisa.
 */
export function DetalheCongregacao({ congregacao: c }: { congregacao: ComumComCultos }) {
  const ensaio = padraoEnsaio(c.ensaio_ord, c.ensaio_dow, c.ensaio_hora);

  return (
    <div>
      <FotoCongregacao
        caminho={c.foto_path}
        nome={c.nome}
        className="aspect-[16/9] w-full"
        sizes="(max-width: 680px) 100vw, 640px"
      />

      <div className="p-5">
        <h1 className="text-xl">{c.nome}</h1>
        <p className="mt-1 text-[13px]">{c.endereco}</p>

        <div className="mt-4">
          <Linha rotulo="Cidade" valor={c.cidade ? nomeDaCidade(c.cidade) : ""} />
          <Linha rotulo="Cultos oficiais" valor={cultosEmTexto(c.cultos)} />
          <Linha rotulo="Ensaio local" valor={ensaio} />
          {ensaio && <Linha rotulo="Frequência" valor={frequenciaEnsaio(c.ensaio_meses)} />}
        </div>

        {c.observacoes && <p className="mt-4 text-[12.5px]">{c.observacoes}</p>}

        <a
          href={urlDoMapa(c)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-azul mt-5 inline-block rounded-portal px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:text-white hover:no-underline hover:opacity-90"
        >
          Abrir no GPS
        </a>
      </div>
    </div>
  );
}
