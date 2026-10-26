import { Carregando, Esqueleto } from "@/components/site/esqueleto";

/** O token só é conhecido na hora do acesso; isto aparece enquanto a escala chega. */
export default function CarregandoRodizio() {
  return (
    <Carregando>
      <div className="bg-cinza rounded-portal h-7 w-52 animate-pulse" />
      <div className="mt-5">
        <Esqueleto linhas={4} altura="h-16" />
      </div>
    </Carregando>
  );
}
