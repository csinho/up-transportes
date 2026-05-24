-- Reparo: rode no SQL Editor se a migration 12 falhou no meio.
-- A migration 11 provavelmente já aplicou tudo (só falhou na policy duplicada).

-- ── convidar_colaborador (mantém default do parâmetro p_role) ────────────────

create or replace function public.convidar_colaborador(
  p_tid uuid,
  p_email text,
  p_role text default 'operador'
)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  email_norm text;
  target_uid uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if not public.user_is_tenant_owner(p_tid) then
    raise exception 'Apenas o proprietário pode gerenciar colaboradores';
  end if;
  if p_role not in ('owner', 'operador') then
    raise exception 'Perfil inválido';
  end if;

  email_norm := lower(trim(p_email));
  if email_norm = '' or email_norm !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'E-mail inválido';
  end if;

  if exists (
    select 1 from auth.users au
    where lower(au.email) = email_norm and au.id = auth.uid()
  ) then
    raise exception 'Use outro e-mail — este é o seu';
  end if;

  target_uid := public.find_auth_user_id_by_email(email_norm);

  if target_uid is not null then
    if exists (
      select 1 from public.user_transportadoras
      where user_id = target_uid and transportadora_id = p_tid
    ) then
      raise exception 'Este usuário já tem acesso à transportadora';
    end if;

    insert into public.user_transportadoras (user_id, transportadora_id, role)
    values (target_uid, p_tid, p_role);

    delete from public.transportadora_convites
    where transportadora_id = p_tid and lower(email) = email_norm;

    return 'ativo';
  end if;

  insert into public.transportadora_convites (transportadora_id, email, role, invited_by)
  values (p_tid, email_norm, p_role, auth.uid())
  on conflict (transportadora_id, email) do update
    set role = excluded.role,
        invited_by = excluded.invited_by,
        created_at = now();

  return 'pendente';
end;
$$;

-- ── Realtime portal cliente (anon) ───────────────────────────────────────────

create or replace function public.viagem_tem_acesso_cliente_ativo(p_viagem_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.viagem_acessos_cliente a
    where a.viagem_id = p_viagem_id
      and a.ativo = true
      and (a.expires_at is null or a.expires_at > now())
  );
$$;

grant execute on function public.viagem_tem_acesso_cliente_ativo(uuid) to anon, authenticated;

drop policy if exists viagens_acompanhamento_cliente on public.viagens;
create policy viagens_acompanhamento_cliente on public.viagens
  for select to anon
  using (public.viagem_tem_acesso_cliente_ativo(id));

drop policy if exists viagem_localizacoes_acompanhamento_cliente on public.viagem_localizacoes;
create policy viagem_localizacoes_acompanhamento_cliente on public.viagem_localizacoes
  for select to anon
  using (public.viagem_tem_acesso_cliente_ativo(viagem_id));
