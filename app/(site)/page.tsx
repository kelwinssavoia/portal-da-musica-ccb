import Link from "next/link";

import {
  IconeCalendario,
  IconeCircular,
  IconeEnsaio,
  IconeIgreja,
  IconePasta,
} from "@/components/icones";
import { getAjustes } from "@/lib/ajustes";

const ATALHOS = [
  {
    href: "/congregacoes",
    nome: "Congregações",
    desc: "Endereços, cultos e ensaios locais.",
    Icone: IconeIgreja,
  },
  {
    href: "/ensaios",
    nome: "Ensaios",
    desc: "Quando é o ensaio de cada comum.",
    Icone: IconeEnsaio,
  },
  {
    href: "/calendario",
    nome: "Calendário",
    desc: "Ensaios, testes e reuniões do mês.",
    Icone: IconeCalendario,
  },
  {
    href: "/circulares",
    nome: "Circulares",
    desc: "Comunicados oficiais da regional.",
    Icone: IconeCircular,
  },
  {
    href: "/secretaria",
    nome: "Secretaria",
    desc: "Fichas, calendários e dúvidas.",
    Icone: IconePasta,
  },
];

export default async function Inicio() {
  const { titulo, heroTexto } = await getAjustes();

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
          {ATALHOS.map(({ href, nome, desc, Icone }) => (
            <Link
              key={href}
              href={href}
              className="bg-superficie border-azul shadow-portal flex gap-3 rounded-r-portal border-l-4 p-4 no-underline hover:no-underline"
            >
              <Icone className="text-azul mt-0.5 size-5 shrink-0" />
              <span>
                <span className="text-azul block text-sm font-bold">{nome}</span>
                <span className="block text-[12.5px]">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
