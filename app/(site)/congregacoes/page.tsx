import { CardCongregacao } from "@/components/site/card-congregacao";
import { listarCongregacoes } from "@/lib/dados/congregacoes";

export const metadata = {
  title: "Congregações",
  description: "Endereços, cultos oficiais e ensaios locais das comuns da região.",
};

export default async function Congregacoes() {
  const congregacoes = await listarCongregacoes();

  return (
    <div>
      <h1 className="text-xl">Congregações</h1>
      <p className="mt-1 text-[13px]">
        {congregacoes.length > 0
          ? `${congregacoes.length} comuns na região. Toque num card para ver os detalhes e a rota.`
          : "Nenhuma congregação cadastrada ainda."}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {congregacoes.map((c) => (
          <CardCongregacao key={c.id} congregacao={c} />
        ))}
      </div>
    </div>
  );
}
