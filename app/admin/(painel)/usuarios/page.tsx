import { FormConvite, FormPermissoes } from "@/components/admin/form-usuario";
import { AREAS_CMS } from "@/lib/areas";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";
import type { PortalArea } from "@/lib/tipos-banco";

export const metadata = { title: "Usuários" };

export default async function AdminUsuarios() {
  // Área restrita: `pode_editar('usuarios')` só é verdade para admin.
  const sessao = await exigirArea("usuarios");

  const supabase = await clienteServidor();
  const [perfis, areas] = await Promise.all([
    supabase.from("perfis").select("*").order("criado_em"),
    supabase.from("perfil_areas").select("*"),
  ]);

  const areasDe = (id: string): PortalArea[] =>
    (areas.data ?? []).filter((a) => a.perfil_id === id).map((a) => a.area);

  const nomeDaArea = new Map(AREAS_CMS.map((a) => [a.area, a.nome]));

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-6">
      <div>
        <h1 className="text-xl">Usuários</h1>
        <p className="mt-1 text-[13px]">
          Quem pode manter o portal, e o que cada um pode editar. Não existe cadastro aberto — só
          entra quem for convidado aqui.
        </p>
      </div>

      <section className="bg-superficie shadow-portal rounded-portal p-5">
        <h2 className="text-base">Convidar</h2>
        <p className="mt-1 text-[12.5px]">
          A pessoa recebe um e-mail com link de acesso. Não há senha para criar nem lembrar.
        </p>
        <div className="mt-4">
          <FormConvite />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base">{perfis.data?.length ?? 0} com acesso</h2>

        {(perfis.data ?? []).map((p) => {
          const souEu = p.id === sessao.perfil.id;
          const dele = areasDe(p.id);

          return (
            <details key={p.id} className="bg-superficie shadow-portal rounded-portal">
              <summary className="cursor-pointer px-4 py-3 text-[13px]">
                <span className="text-azul font-bold">{p.nome || p.email}</span>
                <span className="ml-2 opacity-75">
                  {p.papel === "admin"
                    ? "administrador"
                    : dele.length > 0
                      ? dele.map((a) => nomeDaArea.get(a)).join(", ")
                      : "sem área"}
                </span>
                {!p.ativo && <span className="text-vermelho ml-2">bloqueado</span>}
                {souEu && <span className="ml-2 opacity-60">(você)</span>}
              </summary>

              <div className="border-cinza border-t p-4">
                <p className="mb-4 text-[12px] opacity-75">{p.email}</p>
                <FormPermissoes perfil={p} areas={dele} souEu={souEu} />
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
