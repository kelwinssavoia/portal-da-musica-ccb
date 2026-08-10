import { Carregando, Esqueleto } from "@/components/site/esqueleto";

/**
 * Mostrado enquanto a próxima área carrega.
 *
 * Sem este arquivo o Next espera os dados da página nova antes de trocar a
 * tela — o clique parecia não ter efeito por um ou dois segundos.
 */
export default function CarregandoArea() {
  return (
    <Carregando>
      <div className="bg-cinza rounded-portal h-7 w-52 animate-pulse" />
      <div className="mt-5">
        <Esqueleto linhas={3} altura="h-24" />
      </div>
    </Carregando>
  );
}
