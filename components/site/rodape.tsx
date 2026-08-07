import { getAjustes } from "@/lib/ajustes";

/** Rodapé com borda superior azul de 6px — detalhe do site oficial. */
export async function Rodape() {
  const { localidade, contato, rodapeNota } = await getAjustes();

  return (
    <footer className="bg-cinza border-azul mt-12 border-t-[6px]">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-1.5 px-4 py-7 text-[12.5px]">
        <span className="text-azul font-bold">{localidade}</span>
        {contato && <span>{contato}</span>}
        <span className="opacity-80">{rodapeNota}</span>
      </div>
    </footer>
  );
}
