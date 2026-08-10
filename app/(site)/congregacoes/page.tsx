import { CardCongregacao } from "@/components/site/card-congregacao";
import { agruparPorCidade, listarCongregacoes } from "@/lib/dados/congregacoes";
import { nomeDaCidade } from "@/lib/cidades";

export const metadata = {
  title: "Congregações",
  description: "Endereços, cultos oficiais e ensaios locais das comuns da região.",
};

export default async function Congregacoes() {
  const congregacoes = await listarCongregacoes();
  const grupos = agruparPorCidade(congregacoes);

  // Com uma cidade só (ou nenhuma cadastrada), o título de cidade não informa
  // nada — a grade fica lisa, como antes.
  const agrupar = grupos.length > 1;

  return (
    <div>
      <h1 className="text-xl">Congregações</h1>
      <p className="mt-1 text-[13px]">
        {congregacoes.length === 0
          ? "Nenhuma congregação cadastrada ainda."
          : agrupar
            ? `${congregacoes.length} comuns em ${grupos.filter((g) => g.cidade).length} cidades. Toque num card para ver os detalhes e a rota.`
            : `${congregacoes.length} comuns na região. Toque num card para ver os detalhes e a rota.`}
      </p>

      <div className="mt-6 flex flex-col gap-8">
        {grupos.map((grupo) => (
          <section key={grupo.cidade?.id ?? "sem-cidade"}>
            {agrupar && (
              <h2 className="border-cinza mb-4 border-b-2 pb-1.5 text-base">
                {grupo.cidade ? nomeDaCidade(grupo.cidade) : "Sem cidade definida"}
                <span className="ml-2 text-[12px] font-normal opacity-70">
                  {grupo.comuns.length} {grupo.comuns.length === 1 ? "comum" : "comuns"}
                </span>
              </h2>
            )}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {grupo.comuns.map((c) => (
                <CardCongregacao key={c.id} congregacao={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
