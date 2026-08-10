import Link from "next/link";

import {
  IconeCalendario,
  IconeCircular,
  IconeEnsaio,
  IconeIgreja,
  IconePasta,
} from "@/components/icones";
import { getAjustes } from "@/lib/ajustes";
import { contarConteudo } from "@/lib/dados/secretaria";

/** Plural correto sem depender de biblioteca. */
function contagem(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export default async function Inicio() {
  const [{ titulo, heroTexto }, totais] = await Promise.all([getAjustes(), contarConteudo()]);

  const atalhos = [
    {
      href: "/congregacoes",
      nome: "Congregações",
      desc: "Endereços, cultos e ensaios locais.",
      Icone: IconeIgreja,
      conta: contagem(totais.congregacoes, "congregação", "congregações"),
    },
    {
      href: "/ensaios",
      nome: "Ensaios",
      desc: "Quando é o ensaio de cada comum.",
      Icone: IconeEnsaio,
      conta: "por comum e por dia da semana",
    },
    {
      href: "/calendario",
      nome: "Calendário",
      desc: "Ensaios, testes e reuniões do mês.",
      Icone: IconeCalendario,
      conta: "grade mensal e agenda",
    },
    {
      href: "/circulares",
      nome: "Circulares",
      desc: "Comunicados oficiais da regional.",
      Icone: IconeCircular,
      conta: contagem(totais.circulares, "publicada", "publicadas"),
    },
    {
      href: "/secretaria",
      nome: "Secretaria",
      desc: "Fichas, calendários e dúvidas.",
      Icone: IconePasta,
      conta: contagem(totais.arquivos, "arquivo", "arquivos"),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-azul-escuro rounded-portal px-7 py-9 text-white">
        <h1 className="text-2xl text-white">{titulo}</h1>
        <p className="mt-3 max-w-[62ch] text-sm opacity-90">{heroTexto}</p>
        <p className="mt-4 text-[12.5px] opacity-70">
          Projeto open-source: qualquer regional pode usar o portal na própria região.
        </p>
      </section>

      <section>
        <h2 className="text-lg">Atalhos</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {atalhos.map(({ href, nome, desc, Icone, conta }) => (
            <Link
              key={href}
              href={href}
              className="bg-superficie border-azul shadow-portal rounded-r-portal flex gap-3 border-l-4 p-4 no-underline hover:no-underline"
            >
              <Icone className="text-azul mt-0.5 size-5 shrink-0" />
              <span>
                <span className="text-azul block text-sm font-bold">{nome}</span>
                <span className="block text-[12.5px]">{desc}</span>
                <span className="mt-1 block text-[11.5px] opacity-70">{conta}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
