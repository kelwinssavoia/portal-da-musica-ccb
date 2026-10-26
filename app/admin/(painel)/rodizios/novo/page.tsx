import { EditorRodizio } from "@/components/admin/editor-rodizio";
import { dadosDoEditor } from "@/lib/dados/rodizios";
import { exigirArea } from "@/lib/permissoes";
import { hoje } from "@/lib/hoje";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Novo rodízio" };

/** Mês seguinte inteiro: é o rodízio que a secretaria costuma montar. */
function proximoMes(iso: string) {
  const [ano, mes] = iso.split("-").map(Number);
  const inicio = new Date(Date.UTC(ano, mes, 1));
  const fim = new Date(Date.UTC(ano, mes + 1, 0));
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export default async function NovoRodizio() {
  await exigirArea("rodizios");

  const supabase = await clienteServidor();
  const [{ comuns, organistas }, dia] = await Promise.all([dadosDoEditor(supabase), hoje()]);

  return (
    <div className="mx-auto max-w-[820px]">
      <h1 className="text-xl">Novo rodízio</h1>
      <div className="mt-5">
        <EditorRodizio comuns={comuns} organistas={organistas} periodoSugerido={proximoMes(dia)} />
      </div>
    </div>
  );
}
