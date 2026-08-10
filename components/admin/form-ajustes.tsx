"use client";

import { AreaTexto, Marcar, Texto } from "@/components/admin/campos";
import { FormRegistro } from "@/components/admin/form-registro";
import { CHAVES, salvarAjustes, salvarIndexavel } from "@/app/admin/(painel)/ajustes/acoes";

export function FormAjustes({ valores }: { valores: Record<string, string> }) {
  return (
    <FormRegistro acao={salvarAjustes} rotuloSalvar="Salvar textos">
      {CHAVES.map(({ chave, rotulo, ajuda, longo }) =>
        longo ? (
          <AreaTexto key={chave} nome={chave} rotulo={rotulo} ajuda={ajuda} valor={valores[chave]} />
        ) : (
          <Texto key={chave} nome={chave} rotulo={rotulo} ajuda={ajuda} valor={valores[chave]} />
        ),
      )}
    </FormRegistro>
  );
}

export function FormIndexavel({ indexavel }: { indexavel: boolean }) {
  return (
    <FormRegistro acao={salvarIndexavel} rotuloSalvar="Salvar">
      <Marcar
        nome="indexavel"
        rotulo="O portal pode aparecer no Google"
        valor={indexavel}
        ajuda="Isto é divulgação, não segurança: com ou sem, quem tiver o link abre o portal normalmente. Desmarcar só pede aos buscadores para não listar."
      />
    </FormRegistro>
  );
}
