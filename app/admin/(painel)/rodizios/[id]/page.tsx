import Link from "next/link";
import { notFound } from "next/navigation";

import { EditorRodizio } from "@/components/admin/editor-rodizio";
import { FormExcluir } from "@/components/admin/form-registro";
import { LinkRodizio } from "@/components/admin/link-rodizio";
import { excluirRodizio } from "@/app/admin/(painel)/rodizios/acoes";
import { dadosDoEditor, linkDoRodizio, rodizioCompleto } from "@/lib/dados/rodizios";
import { periodoEmTexto } from "@/lib/datas";
import { exigirArea } from "@/lib/permissoes";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata = { title: "Rodízio" };

export default async function EditarRodizio({
  params,
  searchParams,
}: PageProps<"/admin/rodizios/[id]">) {
  await exigirArea("rodizios");
  const { id } = await params;
  const { salvo } = await searchParams;

  const supabase = await clienteServidor();
  const [rodizio, { comuns, organistas }] = await Promise.all([
    rodizioCompleto(supabase, id),
    dadosDoEditor(supabase),
  ]);
  if (!rodizio) notFound();

  const nomeComum = rodizio.comum?.nome ?? "";

  return (
    <div className="mx-auto flex max-w-[820px] flex-col gap-5">
      <div>
        <Link href="/admin/rodizios" className="text-[12.5px]">
          ← Rodízios
        </Link>
        <h1 className="mt-1 text-xl">{nomeComum}</h1>
        <p className="mt-1 text-[13px]">{periodoEmTexto(rodizio.inicio, rodizio.fim)}</p>
      </div>

      {salvo && (
        <p className="border-verde bg-verde/5 rounded-r-portal border-l-4 p-3 text-[12.5px]">
          Rodízio salvo. Agora é só imprimir ou mandar o link para as organistas.
        </p>
      )}

      <section className="bg-superficie shadow-portal rounded-portal grid gap-5 p-5 sm:grid-cols-2">
        <div>
          <h2 className="text-[15px]">Link para as organistas</h2>
          <p className="mt-1 mb-3 text-[12.5px]">
            Cada uma escolhe o próprio nome ao abrir, e o aparelho lembra nas próximas vezes.
          </p>
          <LinkRodizio url={linkDoRodizio(rodizio.token)} comum={nomeComum} />
        </div>
        <div>
          <h2 className="text-[15px]">Versão impressa</h2>
          <p className="mt-1 mb-3 text-[12.5px]">
            Uma via por organista, com as datas dela em destaque, pronta para recortar. Na janela
            de impressão, escolha a impressora ou “Salvar como PDF”.
          </p>
          <Link
            href={`/admin/rodizios/${rodizio.id}/imprimir`}
            target="_blank"
            className="bg-azul rounded-portal inline-block px-4 py-2 text-[12.5px] font-bold text-white no-underline hover:text-white hover:no-underline"
          >
            Exportar PDF
          </Link>
        </div>
      </section>

      <EditorRodizio
        key={rodizio.atualizado_em}
        comuns={comuns}
        organistas={organistas}
        rodizio={rodizio}
        periodoSugerido={{ inicio: rodizio.inicio, fim: rodizio.fim }}
      />

      <div className="border-cinza border-t pt-5">
        <FormExcluir
          acao={excluirRodizio}
          id={rodizio.id}
          rotulo="Excluir rodízio"
          pergunta="Excluir este rodízio? O link das organistas para de funcionar."
        />
      </div>
    </div>
  );
}
