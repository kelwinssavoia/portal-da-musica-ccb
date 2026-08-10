import { Suspense } from "react";
import Link from "next/link";

import { Abas } from "@/components/site/abas";
import { Selo } from "@/components/site/selo";
import { dataCurta, DIAS, formatarHora, frequenciaEnsaio, ORDINAIS, padraoEnsaio } from "@/lib/datas";
import { comunsComEnsaio, ensaiosRegionais, type ComumComEnsaio } from "@/lib/dados/eventos";
import { classeDestaque, destaqueDe } from "@/lib/destaque";
import { hojeISO } from "@/lib/datas";
import { partesISO } from "@/lib/ensaios";

export const metadata = {
  title: "Ensaios",
  description: "Quando é o ensaio local de cada comum da região, e os ensaios regionais.",
};

const VISOES = [
  { valor: "comum", nome: "Por comum" },
  { valor: "semana", nome: "Por dia da semana" },
  { valor: "proximos", nome: "Próximos do mês" },
];

export default function Ensaios({ searchParams }: PageProps<"/ensaios">) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">Ensaios</h1>
        <p className="mt-1 text-[13px]">
          O ensaio local de cada comum acontece num dia fixo do mês — por exemplo, no 3º domingo.
        </p>
      </div>

      <Suspense fallback={<p className="text-[13px]">Carregando ensaios…</p>}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Conteudo({ searchParams }: { searchParams: PageProps<"/ensaios">["searchParams"] }) {
  const { visao } = await searchParams;
  const atual = typeof visao === "string" && VISOES.some((v) => v.valor === visao) ? visao : "comum";

  const hoje = hojeISO();
  const { ano, mes } = partesISO(hoje);
  const fimDoAno = `${ano + 1}-12-31`;

  const [comuns, regionais] = await Promise.all([
    comunsComEnsaio(hoje),
    ensaiosRegionais(hoje, fimDoAno),
  ]);

  return (
    <>
      <Abas opcoes={VISOES} atual={atual} base="/ensaios" param="visao" />

      {comuns.length === 0 && (
        <p className="text-[13px]">Nenhuma comum com ensaio local cadastrado ainda.</p>
      )}

      {atual === "comum" && <PorComum comuns={comuns} hoje={hoje} />}
      {atual === "semana" && <PorSemana comuns={comuns} hoje={hoje} />}
      {atual === "proximos" && <ProximosDoMes comuns={comuns} hoje={hoje} mes={mes} ano={ano} />}

      <section>
        <h2 className="text-lg">Ensaios regionais</h2>
        {regionais.length === 0 ? (
          <p className="mt-2 text-[13px]">Nenhum ensaio regional agendado.</p>
        ) : (
          <ul className="bg-superficie shadow-portal rounded-portal mt-3 overflow-hidden">
            {regionais.map((e) => {
              const destaque = destaqueDe(e.data, hoje);
              return (
                <li
                  key={e.id}
                  className="border-cinza flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-[13px] last:border-b-0"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-azul font-bold">{dataCurta(e.data)}</span>
                    {e.hora && <span className="opacity-80">{formatarHora(e.hora)}</span>}
                    <Selo destaque={destaque} />
                  </span>
                  {e.congregacaoSlug && (
                    <Link href={`/congregacoes/${e.congregacaoSlug}`} className="text-[12.5px]">
                      {e.congregacaoNome}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

/** Visão 1: um card por comum, com o padrão em destaque. */
function PorComum({ comuns, hoje }: { comuns: ComumComEnsaio[]; hoje: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {comuns.map(({ congregacao: c, proximo }) => {
        const destaque = proximo ? destaqueDe(proximo.data, hoje) : null;

        return (
          <div
            key={c.id}
            className={`bg-superficie shadow-portal rounded-r-portal border-l-4 p-4 ${classeDestaque(destaque)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <Link href={`/congregacoes/${c.slug}`} className="text-sm font-bold">
                {c.nome}
              </Link>
              <Selo destaque={destaque} />
            </div>

            <p className="text-azul mt-2 text-[15px] font-bold">
              {padraoEnsaio(c.ensaio_ord, c.ensaio_dow, c.ensaio_hora)}
            </p>
            <p className="mt-0.5 text-[12px] opacity-75">{frequenciaEnsaio(c.ensaio_meses)}</p>

            <p className="mt-3 text-[12.5px]">
              Próximo ensaio:{" "}
              <span className="text-azul font-bold">
                {proximo ? dataCurta(proximo.data) : "sem data"}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Visão 2: agrupado por dia da semana; o ordinal + dia é a informação principal. */
function PorSemana({ comuns, hoje }: { comuns: ComumComEnsaio[]; hoje: string }) {
  const porDia = DIAS.map((nome, dow) => ({
    dow,
    nome,
    comuns: comuns.filter((c) => c.congregacao.ensaio_dow === dow),
  })).filter((g) => g.comuns.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {porDia.map((grupo) => (
        <section key={grupo.dow}>
          <h2 className="text-base">{grupo.nome}</h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grupo.comuns.map(({ congregacao: c, proximo }) => {
              const destaque = proximo ? destaqueDe(proximo.data, hoje) : null;

              return (
                <div
                  key={c.id}
                  className={`bg-superficie shadow-portal rounded-r-portal border-l-4 p-4 ${classeDestaque(destaque)}`}
                >
                  <p className="text-azul text-[15px] font-bold">
                    {ORDINAIS[c.ensaio_ord!]} {grupo.nome}
                  </p>
                  <p className="mt-0.5 text-[12.5px]">
                    {formatarHora(c.ensaio_hora)} · {frequenciaEnsaio(c.ensaio_meses)}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Link href={`/congregacoes/${c.slug}`} className="text-[13px] font-bold">
                      {c.nome}
                    </Link>
                    <Selo destaque={destaque} />
                  </div>

                  <p className="mt-2 text-[12px] opacity-75">
                    Próximo ensaio: {proximo ? dataCurta(proximo.data) : "sem data"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Visão 3: só os ensaios que ainda vão acontecer no mês atual. */
function ProximosDoMes({
  comuns,
  hoje,
  mes,
  ano,
}: {
  comuns: ComumComEnsaio[];
  hoje: string;
  mes: number;
  ano: number;
}) {
  const doMes = comuns
    .filter(({ proximo }) => {
      if (!proximo) return false;
      const p = partesISO(proximo.data);
      return p.ano === ano && p.mes === mes;
    })
    .sort((a, b) => a.proximo!.data.localeCompare(b.proximo!.data));

  if (doMes.length === 0) {
    return (
      <p className="text-[13px]">
        Nenhum ensaio local restante neste mês. Veja a visão “Por comum” para as próximas datas.
      </p>
    );
  }

  return (
    <ul className="bg-superficie shadow-portal rounded-portal overflow-hidden">
      {doMes.map(({ congregacao: c, proximo }) => {
        const destaque = destaqueDe(proximo!.data, hoje);

        return (
          <li
            key={c.id}
            className="border-cinza flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 last:border-b-0"
          >
            <span className="flex items-center gap-2 text-[13px]">
              <span className="text-azul font-bold">{dataCurta(proximo!.data)}</span>
              <span className="opacity-80">{formatarHora(proximo!.hora)}</span>
              <Selo destaque={destaque} />
            </span>
            <Link href={`/congregacoes/${c.slug}`} className="text-[12.5px]">
              {c.nome}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
