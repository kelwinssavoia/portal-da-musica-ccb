import { CircularDestaque, ListaCirculares } from "@/components/site/circulares";
import { listarCirculares } from "@/lib/dados/circulares";

export const metadata = {
  title: "Circulares",
  description: "Comunicados oficiais da Secretaria da Música da região.",
};

export default async function Circulares() {
  const circulares = await listarCirculares();
  const [maisRecente, ...demais] = circulares;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">Circulares</h1>
        <p className="mt-1 text-[13px]">
          Comunicados da regional. Os arquivos abrem em nova aba.
        </p>
      </div>

      {!maisRecente && <p className="text-[13px]">Nenhuma circular publicada ainda.</p>}

      {maisRecente && <CircularDestaque circular={maisRecente} />}

      {demais.length > 0 && (
        <section>
          <h2 className="text-lg">Anteriores</h2>
          <div className="mt-3">
            <ListaCirculares circulares={demais} />
          </div>
        </section>
      )}
    </div>
  );
}
