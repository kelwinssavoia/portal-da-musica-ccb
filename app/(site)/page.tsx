import { Suspense } from "react";
import Link from "next/link";

import {
  IconeCalendario,
  IconeCircular,
  IconeEnsaio,
  IconeIgreja,
  IconePasta,
} from "@/components/icones";
import { CircularDestaque, ListaCirculares } from "@/components/site/circulares";
import { ProximosEventos } from "@/components/site/proximos-eventos";
import { getAjustes } from "@/lib/ajustes";
import { listarCirculares } from "@/lib/dados/circulares";
import { eventosDoPeriodo, listarTiposEvento } from "@/lib/dados/eventos";
import { contarConteudo } from "@/lib/dados/secretaria";
import { hoje as hojeDaRegional } from "@/lib/hoje";
import { partesISO } from "@/lib/ensaios";

/** Plural correto sem depender de biblioteca. */
function contagem(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export default function Inicio() {
  return (
    <div className="flex flex-col gap-8">
      <Hero />

      <Atalhos />

      <section>
        <h2 className="text-lg">Próximos eventos</h2>
        <div className="mt-3">
          <Suspense fallback={<p className="text-[13px]">Carregando eventos…</p>}>
            <Proximos />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={null}>
        <UltimasCirculares />
      </Suspense>
    </div>
  );
}

async function Hero() {
  const { titulo, heroTexto } = await getAjustes();

  return (
    <section className="bg-azul-escuro rounded-portal px-7 py-9 text-white">
      <h1 className="text-2xl text-white">{titulo}</h1>
      <p className="mt-3 max-w-[62ch] text-sm opacity-90">{heroTexto}</p>
      <p className="mt-4 text-[12.5px] opacity-70">
        Projeto open-source: qualquer regional pode usar o portal na própria região.
      </p>
    </section>
  );
}

async function Atalhos() {
  const totais = await contarConteudo();

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
  );
}

/** Até 5 eventos futuros, olhando um ano à frente. */
async function Proximos() {
  const hoje = await hojeDaRegional();
  const { ano } = partesISO(hoje);

  const [eventos, tipos] = await Promise.all([
    eventosDoPeriodo(hoje, `${ano + 1}-12-31`),
    listarTiposEvento(),
  ]);

  return <ProximosEventos eventos={eventos.slice(0, 5)} tipos={tipos} hoje={hoje} />;
}

async function UltimasCirculares() {
  const circulares = await listarCirculares();
  if (circulares.length === 0) return null;

  const [maisRecente, ...demais] = circulares;

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">Últimas circulares</h2>
        <Link href="/circulares" className="text-[12.5px] font-bold">
          Ver todas →
        </Link>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <CircularDestaque circular={maisRecente} />
        {demais.length > 0 && <ListaCirculares circulares={demais.slice(0, 3)} />}
      </div>
    </section>
  );
}
