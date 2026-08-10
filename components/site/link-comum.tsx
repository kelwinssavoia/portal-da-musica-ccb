import Link from "next/link";

/**
 * Nome da comum como link para o detalhe dela.
 *
 * Leva um ícone no fim porque, dentro do calendário e das listas, o nome
 * sublinhado sozinho não se distinguia do texto ao redor — não parecia
 * clicável.
 */
export function LinkComum({
  slug,
  nome,
  className = "text-[12.5px]",
}: {
  slug: string;
  nome: string | null;
  className?: string;
}) {
  return (
    <Link
      href={`/congregacoes/${slug}`}
      className={`inline-flex items-center gap-1 underline ${className}`}
    >
      {nome}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-3 shrink-0 opacity-80"
      >
        {/* Seta para fora de um quadro: convenção de "abre o detalhe". */}
        <path d="M14 4h6v6" />
        <path d="M20 4 11 13" />
        <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
      </svg>
    </Link>
  );
}
