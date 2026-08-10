import { CardArquivo } from "@/components/site/card-arquivo";
import { listarCategorias, listarDuvidas } from "@/lib/dados/secretaria";

export const metadata = {
  title: "Secretaria",
  description: "Fichas, calendários e dúvidas frequentes da Secretaria da Música.",
};

export default async function Secretaria() {
  const [categorias, duvidas] = await Promise.all([listarCategorias(), listarDuvidas()]);
  const comArquivos = categorias.filter((c) => c.arquivos.length > 0);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-xl">Secretaria</h1>
        <p className="mt-1 text-[13px]">
          Fichas e calendários da secretaria da música. Os arquivos abrem em nova aba.
        </p>
      </div>

      {comArquivos.length === 0 && (
        <p className="text-[13px]">Nenhum arquivo publicado ainda.</p>
      )}

      {comArquivos.map((categoria) => (
        <section key={categoria.id}>
          <h2 className="text-lg">{categoria.nome}</h2>
          {categoria.descricao && (
            <p className="mt-1 text-[12.5px]">{categoria.descricao}</p>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {categoria.arquivos.map((arquivo) => (
              <CardArquivo key={arquivo.id} arquivo={arquivo} />
            ))}
          </div>
        </section>
      ))}

      {duvidas.length > 0 && (
        <section>
          <h2 className="text-lg">Dúvidas frequentes</h2>

          {/* <details> nativo: o acordeão funciona sem JavaScript. */}
          <div className="bg-superficie shadow-portal rounded-portal mt-4 overflow-hidden">
            {duvidas.map((d) => (
              <details key={d.id} className="border-cinza border-b last:border-b-0">
                <summary className="text-azul cursor-pointer px-4 py-3 text-[13px] font-bold">
                  {d.pergunta}
                </summary>
                <p className="px-4 pb-4 text-[12.5px]">{d.resposta}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
