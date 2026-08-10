"use client";

import { Marcar, Selecao, Texto } from "@/components/admin/campos";
import { FormExcluir, FormRegistro } from "@/components/admin/form-registro";
import {
  criarAcesso,
  definirSenha,
  removerUsuario,
  salvarPermissoes,
} from "@/app/admin/(painel)/usuarios/acoes";
import { SENHA_MINIMA } from "@/lib/senha";
import { AREAS_CMS } from "@/lib/areas";
import type { Perfil, PortalArea } from "@/lib/tipos-banco";

const PAPEIS = [
  { valor: "editor", nome: "Editor (só as áreas marcadas)" },
  { valor: "admin", nome: "Administrador (tudo, inclusive usuários)" },
];

function Areas({ marcadas }: { marcadas: PortalArea[] }) {
  return (
    <fieldset className="border-cinza rounded-portal border p-4">
      <legend className="text-azul px-1 text-[12.5px] font-bold">Áreas do editor</legend>
      <p className="mb-2 text-[11.5px] opacity-70">
        Ignorado quando o papel é administrador — admin pode tudo.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {AREAS_CMS.map((a) => (
          <label key={a.area} className="flex items-center gap-2 text-[12.5px]">
            <input
              type="checkbox"
              name={`area_${a.area}`}
              value="sim"
              defaultChecked={marcadas.includes(a.area)}
              className="size-4"
            />
            {a.nome}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FormNovoAcesso() {
  return (
    <FormRegistro acao={criarAcesso} rotuloSalvar="Criar acesso">
      <div className="grid gap-4 sm:grid-cols-2">
        <Texto nome="email" rotulo="E-mail" tipo="email" obrigatorio />
        <Texto nome="nome" rotulo="Nome" ajuda="Só para identificar quem é." />
      </div>

      <Texto
        nome="senha"
        rotulo="Senha provisória"
        tipo="password"
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
        ajuda={`Deixe em branco para o portal gerar uma. Ao menos ${SENHA_MINIMA} caracteres.`}
      />

      <Selecao nome="papel" rotulo="Papel" obrigatorio vazio={null} opcoes={PAPEIS} valor="editor" />

      <Areas marcadas={[]} />
    </FormRegistro>
  );
}

/** Redefine a senha de outra pessoa — é o "esqueci minha senha" do portal. */
export function FormDefinirSenha({ id }: { id: string }) {
  return (
    <FormRegistro acao={definirSenha} rotuloSalvar="Redefinir senha">
      <input type="hidden" name="id" value={id} />
      <Texto
        nome="senha"
        rotulo="Nova senha provisória"
        tipo="password"
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
        ajuda="Deixe em branco para o portal gerar uma."
      />
    </FormRegistro>
  );
}

export function FormPermissoes({
  perfil,
  areas,
  souEu,
}: {
  perfil: Perfil;
  areas: PortalArea[];
  souEu: boolean;
}) {
  return (
    <FormRegistro
      acao={salvarPermissoes}
      rotuloSalvar="Salvar permissões"
      aoLado={
        souEu ? undefined : (
          <FormExcluir
            acao={removerUsuario}
            id={perfil.id}
            rotulo="Remover acesso"
            pergunta="Remover o acesso desta pessoa ao CMS? O conteúdo que ela cadastrou continua no portal."
          />
        )
      }
    >
      <input type="hidden" name="id" value={perfil.id} />

      <Selecao
        nome="papel"
        rotulo="Papel"
        obrigatorio
        vazio={null}
        opcoes={PAPEIS}
        valor={perfil.papel}
      />

      <Marcar
        nome="ativo"
        rotulo="Acesso liberado"
        valor={perfil.ativo}
        ajuda="Desmarque para bloquear sem remover."
      />

      {souEu && (
        <p className="border-cinza rounded-portal border p-3 text-[12px]">
          Este é o seu próprio acesso. Você não pode remover seu papel de administrador — se pudesse,
          a regional poderia ficar sem ninguém para gerenciar usuários.
        </p>
      )}

      <Areas marcadas={areas} />
    </FormRegistro>
  );
}
