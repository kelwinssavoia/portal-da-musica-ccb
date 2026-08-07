/**
 * Marcador honesto para área ainda não implementada.
 * Some conforme as fases do plano em docs/ARQUITETURA.md §12 forem entregues.
 */
export function EmConstrucao({ area, fase }: { area: string; fase: string }) {
  return (
    <div className="bg-superficie border-azul shadow-portal rounded-r-portal border-l-4 p-6">
      <h2 className="text-lg">{area}</h2>
      <p className="mt-2 text-sm">
        Esta área ainda está sendo construída. Entrega prevista para a{" "}
        <strong>{fase}</strong> do plano do projeto.
      </p>
    </div>
  );
}
