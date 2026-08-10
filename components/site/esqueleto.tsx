/** Blocos cinzas que ocupam o lugar do conteúdo enquanto ele chega. */
export function Esqueleto({ linhas = 3, altura = "h-20" }: { linhas?: number; altura?: string }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className={`bg-cinza rounded-portal animate-pulse ${altura}`} />
      ))}
    </div>
  );
}

/** Aviso acessível de que a página está carregando. */
export function Carregando({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Carregando…</span>
      {children}
    </div>
  );
}
