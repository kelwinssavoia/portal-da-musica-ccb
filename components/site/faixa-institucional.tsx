import { getAjustes } from "@/lib/ajustes";

/** Faixa escura do topo, presente em todas as áreas. */
export async function FaixaInstitucional() {
  const { instituicao, regiao } = await getAjustes();

  return (
    <div className="bg-azul-escuro text-[11px] tracking-[0.04em] text-white uppercase">
      <div className="mx-auto flex min-h-8 w-full max-w-[1040px] items-center justify-between gap-3 px-4">
        <span className="font-bold">
          {instituicao} — {regiao}
        </span>
        <span className="text-[10.5px] tracking-normal normal-case opacity-70">
          Portal open-source
        </span>
      </div>
    </div>
  );
}
