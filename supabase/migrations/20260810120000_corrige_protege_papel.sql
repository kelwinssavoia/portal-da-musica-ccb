-- Corrige `protege_papel()`: ela impedia criar o primeiro administrador.
--
-- A função existe para que nenhum usuário do portal se promova a admin nem
-- libere o próprio acesso. Mas ela usava `is_admin()`, que é falso quando não
-- há usuário autenticado — e é justamente esse o caso de quem roda SQL pelo
-- painel, por migração ou com a chave secreta.
--
-- Resultado: o passo de instalação "promova o primeiro admin com um UPDATE"
-- falhava com "Somente administradores alteram papel ou situação de acesso", e
-- a instância ficava sem nenhum administrador possível.
--
-- Agora, sem `auth.uid()` a alteração passa: quem chama nessa situação é o dono
-- do banco, que já tem poder total de qualquer forma. A proteção continua
-- valendo onde importa — contra escalada de privilégio por usuário do portal.

create or replace function public.protege_papel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Fora de sessão de usuário (painel, migração, chave secreta): libera.
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_admin() then
    if new.papel is distinct from old.papel or new.ativo is distinct from old.ativo then
      raise exception 'Somente administradores alteram papel ou situação de acesso.';
    end if;
  end if;

  return new;
end;
$$;
