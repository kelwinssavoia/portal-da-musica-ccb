/**
 * A grade fica em `children` e o detalhe interceptado em `modal`: clicar num
 * card abre o modal sem sair da grade, mas a URL vira /congregacoes/<slug> —
 * link compartilhável, e recarregar mostra a página inteira.
 */
export default function CongregacoesLayout({
  children,
  modal,
}: LayoutProps<"/congregacoes">) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
