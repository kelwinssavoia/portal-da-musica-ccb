/**
 * Moldura do link das organistas.
 *
 * De propósito sem a faixa, o cabeçalho, o menu e o rodapé do portal: quem abre
 * é a irmã pelo celular, a partir do grupo, e a tela é só a escala dela.
 */
export default function RodizioLayout({ children }: LayoutProps<"/rodizio">) {
  return <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-6">{children}</main>;
}
