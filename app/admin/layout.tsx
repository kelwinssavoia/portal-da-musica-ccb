/**
 * Moldura mínima de tudo sob /admin.
 *
 * O login precisa ficar FORA da verificação de sessão, senão daria loop de
 * redirecionamento — por isso a checagem mora no layout do grupo `(painel)`,
 * e `/admin/login` não pertence a esse grupo.
 */
export const metadata = {
  title: { default: "Manutenção", template: "%s · Manutenção" },
  // O CMS nunca é indexado, em qualquer configuração do portal.
  robots: { index: false, follow: false },
};

export default function AdminRaiz({ children }: LayoutProps<"/admin">) {
  return children;
}
