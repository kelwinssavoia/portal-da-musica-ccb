import { FormSenha } from "@/components/admin/form-senha";
import { exigirSessao } from "@/lib/permissoes";

export const metadata = { title: "Minha senha" };

export default async function MinhaSenha() {
  const sessao = await exigirSessao();

  return (
    <div className="mx-auto max-w-[480px]">
      <h1 className="text-xl">Minha senha</h1>
      <p className="mt-1 text-[13px]">
        Acesso de <strong>{sessao.perfil.email}</strong>.
      </p>

      <div className="bg-superficie shadow-portal rounded-portal mt-5 p-5">
        <FormSenha />
      </div>

      <p className="mt-4 text-[12px] opacity-70">
        Se você entrou com uma senha provisória que alguém passou para você, troque agora.
      </p>
    </div>
  );
}
