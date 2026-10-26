import Link from "next/link";

import { areasVisiveis, exigirSessao } from "@/lib/permissoes";

const DESCRICAO: Record<string, string> = {
  "/admin/congregacoes": "Endereços, culto oficial e o padrão de ensaio de cada comum.",
  "/admin/eventos": "Ensaios regionais, testes, reuniões e exceções de ensaio local.",
  "/admin/circulares": "Publicar comunicados da regional.",
  "/admin/arquivos": "Fichas e calendários da secretaria, por categoria.",
  "/admin/duvidas": "Perguntas frequentes do portal.",
  "/admin/rodizios": "Rodízio de organistas por comum: gerar, ajustar, imprimir e enviar o link.",
  "/admin/ajustes": "Textos institucionais e opções gerais.",
  "/admin/usuarios": "Convidar irmãos e definir o que cada um pode editar.",
};

export default async function Painel({ searchParams }: PageProps<"/admin">) {
  const sessao = await exigirSessao();
  const areas = areasVisiveis(sessao);
  const { erro } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">Manutenção do portal</h1>
        <p className="mt-1 text-[13px]">
          O que você salvar aqui aparece no portal em segundos. Não é preciso publicar nada.
        </p>
      </div>

      {erro === "sem-permissao" && (
        <p className="border-vermelho bg-vermelho/5 rounded-r-portal border-l-4 p-3 text-[12.5px]">
          Você não tem permissão para aquela área. Fale com um administrador do portal.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {areas.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-superficie border-azul shadow-portal rounded-r-portal border-l-4 p-4 no-underline hover:no-underline"
          >
            <span className="text-azul block text-sm font-bold">{a.nome}</span>
            <span className="mt-0.5 block text-[12.5px]">{DESCRICAO[a.href]}</span>
          </Link>
        ))}
      </div>

      <div className="border-cinza rounded-portal border p-4 text-[12.5px]">
        <p className="text-azul font-bold">Regra do portal: nada de dado pessoal</p>
        <p className="mt-1">
          O portal é público na internet e aparece no Google. Não cadastre nome de irmão, telefone,
          e-mail ou lista de músicos e organistas — nem em descrição, nem em observação, nem em
          resposta de dúvida. A única exceção é o Rodízio de organistas: os nomes ficam só no
          painel e no link enviado a elas, fora do portal e dos buscadores.
        </p>
      </div>
    </div>
  );
}
