import Link from "next/link";

import { FormExcecao } from "@/components/admin/form-evento";
import { dataLonga, formatarHora } from "@/lib/datas";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Eventos" };

export default async function AdminEventos() {
  await exigirArea("eventos");

  const supabase = await clienteServidor();
  const [eventos, tipos, congregacoes, excecoes] = await Promise.all([
    supabase.from("eventos").select("*").order("data", { ascending: false }),
    supabase.from("tipos_evento").select("*").order("ordem"),
    supabase.from("congregacoes").select("*").order("nome"),
    supabase.from("ensaio_excecoes").select("*").order("data_original", { ascending: false }),
  ]);

  const label = new Map((tipos.data ?? []).map((t) => [t.id, t.label]));
  const nomeComum = new Map((congregacoes.data ?? []).map((c) => [c.id, c.nome]));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl">Eventos</h1>
          <p className="mt-1 text-[13px]">
            Ensaios regionais, testes e reuniões. O ensaio local vem do padrão da comum, em
            Congregações.
          </p>
        </div>
        <Link
          href="/admin/eventos/novo"
          className="bg-azul rounded-portal px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:text-white hover:no-underline"
        >
          Novo evento
        </Link>
      </div>

      <section>
        <h2 className="text-base">{eventos.data?.length ?? 0} agendados</h2>

        {(eventos.data?.length ?? 0) === 0 ? (
          <p className="mt-2 text-[13px]">Nenhum evento cadastrado.</p>
        ) : (
          <div className="bg-superficie shadow-portal rounded-portal mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[12.5px]">
              <thead className="border-cinza text-azul border-b">
                <tr>
                  <th className="px-4 py-2.5">Data</th>
                  <th className="px-4 py-2.5">Tipo</th>
                  <th className="px-4 py-2.5">Onde</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {(eventos.data ?? []).map((e) => (
                  <tr key={e.id} className="border-cinza border-b last:border-b-0">
                    <td className="px-4 py-2.5">
                      <span className="text-azul font-bold">{dataLonga(e.data)}</span>
                      {e.hora && <span className="ml-2 opacity-75">{formatarHora(e.hora)}</span>}
                      {!e.ativo && <span className="ml-2 opacity-60">(oculto)</span>}
                    </td>
                    <td className="px-4 py-2.5">{label.get(e.tipo_id) ?? e.tipo_id}</td>
                    <td className="px-4 py-2.5">
                      {e.congregacao_id ? nomeComum.get(e.congregacao_id) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/admin/eventos/${e.id}`}>Editar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base">Exceções de ensaio local</h2>
        <p className="mt-1 text-[12.5px]">
          Use quando um ensaio específico foi cancelado ou mudou de data. O padrão da comum continua
          o mesmo — só aquela data muda.
        </p>

        {(excecoes.data?.length ?? 0) > 0 && (
          <div className="bg-superficie shadow-portal rounded-portal mt-3 flex flex-col">
            {(excecoes.data ?? []).map((x) => (
              <details key={x.id} className="border-cinza border-b last:border-b-0">
                <summary className="text-azul cursor-pointer px-4 py-3 text-[12.5px] font-bold">
                  {nomeComum.get(x.congregacao_id) ?? "comum"} · {dataLonga(x.data_original)} ·{" "}
                  {x.cancelado
                    ? "cancelado"
                    : `movido para ${x.nova_data ? dataLonga(x.nova_data) : "nova hora"}`}
                </summary>
                <div className="p-4">
                  <FormExcecao congregacoes={congregacoes.data ?? []} excecao={x} />
                </div>
              </details>
            ))}
          </div>
        )}

        <div className="bg-superficie shadow-portal rounded-portal mt-4 p-5">
          <h3 className="text-[13px] font-bold">Nova exceção</h3>
          <div className="mt-4">
            <FormExcecao congregacoes={congregacoes.data ?? []} />
          </div>
        </div>
      </section>
    </div>
  );
}
