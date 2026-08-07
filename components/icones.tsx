/**
 * Ícones monocromáticos de linha, coerentes com o site oficial da CCB.
 * Regra do projeto: nunca usar emoji como ícone.
 */

type Props = {
  className?: string;
};

function Svg({ children, className }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? "size-5"}
    >
      {children}
    </svg>
  );
}

export function IconeBusca(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" />
    </Svg>
  );
}

export function IconeIgreja(props: Props) {
  return (
    <Svg {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V8l7-5 7 5v13" />
      <path d="M10 21v-5h4v5" />
    </Svg>
  );
}

export function IconeCalendario(props: Props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

export function IconeCircular(props: Props) {
  return (
    <Svg {...props}>
      <path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" />
      <path d="M18 8a5 5 0 0 1 0 8" />
    </Svg>
  );
}

export function IconePasta(props: Props) {
  return (
    <Svg {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Svg>
  );
}

export function IconeEnsaio(props: Props) {
  return (
    <Svg {...props}>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </Svg>
  );
}
