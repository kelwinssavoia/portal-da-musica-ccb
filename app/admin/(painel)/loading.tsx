import { Carregando, Esqueleto } from "@/components/site/esqueleto";

/** Feedback imediato ao navegar entre as áreas de manutenção. */
export default function CarregandoPainel() {
  return (
    <Carregando>
      <div className="bg-cinza rounded-portal h-7 w-44 animate-pulse" />
      <div className="mt-5">
        <Esqueleto linhas={4} altura="h-16" />
      </div>
    </Carregando>
  );
}
