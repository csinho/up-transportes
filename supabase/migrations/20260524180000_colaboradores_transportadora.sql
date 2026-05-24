-- Colaboradores da transportadora: convites pendentes + gestão de membros

create table if not exists public.transportadora_convites (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  email text not null,
  role text not null default 'operador'
    check (role in ('owner', 'operador', 'visualizador')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (transportadora_id, email)
);

create index if not exists idx_transportadora_convites_email
  on public.transportadora_convites (lower(email));

create or replace function public.user_tenant_role(tid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.user_transportadoras
  where user_id = auth.uid() and transportadora_id = tid
  limit 1;
$$;

create or replace function public.user_is_tenant_owner(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_tenant_role(tid) = 'owner';
$$;

create or replace function public.find_auth_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;

create or replace function public.aceitar_convites_pendentes()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  user_email text;
  vinculados integer := 0;
  conv record;
begin
  if auth.uid() is null then
    return 0;
  end if;

  select lower(email) into user_email from auth.users where id = auth.uid();
  if user_email is null then
    return 0;
  end if;

  for conv in
    select c.transportadora_id, c.role
    from public.transportadora_convites c
    where lower(c.email) = user_email
  loop
    insert into public.user_transportadoras (user_id, transportadora_id, role)
    values (auth.uid(), conv.transportadora_id, conv.role)
    on conflict (user_id, transportadora_id) do update set role = excluded.role;

    delete from public.transportadora_convites
    where transportadora_id = conv.transportadora_id and lower(email) = user_email;

    vinculados := vinculados + 1;
  end loop;

  return vinculados;
end;
$$;

grant execute on function public.aceitar_convites_pendentes() to authenticated;

create or replace function public.list_transportadora_colaboradores(p_tid uuid)
returns table (
  registro_id text,
  user_id uuid,
  email text,
  nome text,
  role text,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if not public.user_has_tenant(p_tid) then
    raise exception 'Sem acesso a esta transportadora';
  end if;

  return query
  select
    ut.user_id::text as registro_id,
    ut.user_id,
    coalesce(au.email, '') as email,
    coalesce(p.nome, split_part(coalesce(au.email, ''), '@', 1)) as nome,
    ut.role,
    'ativo'::text as status,
    ut.created_at
  from public.user_transportadoras ut
  left join auth.users au on au.id = ut.user_id
  left join public.profiles p on p.id = ut.user_id
  where ut.transportadora_id = p_tid

  union all

  select
    'convite:' || c.id::text as registro_id,
    null::uuid as user_id,
    c.email,
    split_part(c.email, '@', 1) as nome,
    c.role,
    'pendente'::text as status,
    c.created_at
  from public.transportadora_convites c
  where c.transportadora_id = p_tid

  order by 7 desc;
end;
$$;

grant execute on function public.list_transportadora_colaboradores(uuid) to authenticated;

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
  if p_role not in ('owner', 'operador', 'visualizador') then
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

grant execute on function public.convidar_colaborador(uuid, text, text) to authenticated;

create or replace function public.atualizar_colaborador_role(
  p_tid uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if not public.user_is_tenant_owner(p_tid) then
    raise exception 'Apenas o proprietário pode alterar perfis';
  end if;
  if p_role not in ('owner', 'operador', 'visualizador') then
    raise exception 'Perfil inválido';
  end if;
  if not exists (
    select 1 from public.user_transportadoras
    where user_id = p_user_id and transportadora_id = p_tid
  ) then
    raise exception 'Colaborador não encontrado';
  end if;

  if p_role <> 'owner' and exists (
    select 1 from public.user_transportadoras
    where user_id = p_user_id and transportadora_id = p_tid and role = 'owner'
  ) and (
    select count(*) from public.user_transportadoras
    where transportadora_id = p_tid and role = 'owner'
  ) <= 1 then
    raise exception 'Não é possível remover o último proprietário';
  end if;

  update public.user_transportadoras
  set role = p_role
  where user_id = p_user_id and transportadora_id = p_tid;
end;
$$;

grant execute on function public.atualizar_colaborador_role(uuid, uuid, text) to authenticated;

create or replace function public.remover_colaborador(p_registro_id text, p_tid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_uid uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if not public.user_is_tenant_owner(p_tid) then
    raise exception 'Apenas o proprietário pode remover colaboradores';
  end if;

  if p_registro_id like 'convite:%' then
    delete from public.transportadora_convites
    where id = (substring(p_registro_id from 9))::uuid
      and transportadora_id = p_tid;
    return;
  end if;

  target_uid := p_registro_id::uuid;

  if target_uid = auth.uid() then
    raise exception 'Você não pode remover a si mesmo';
  end if;

  if exists (
    select 1 from public.user_transportadoras
    where user_id = target_uid and transportadora_id = p_tid and role = 'owner'
  ) and (
    select count(*) from public.user_transportadoras
    where transportadora_id = p_tid and role = 'owner'
  ) <= 1 then
    raise exception 'Não é possível remover o último proprietário';
  end if;

  delete from public.user_transportadoras
  where user_id = target_uid and transportadora_id = p_tid;
end;
$$;

grant execute on function public.remover_colaborador(text, uuid) to authenticated;

alter table public.transportadora_convites enable row level security;

create policy convites_owner_select on public.transportadora_convites
  for select to authenticated
  using (public.user_is_tenant_owner(transportadora_id));

create policy convites_owner_delete on public.transportadora_convites
  for delete to authenticated
  using (public.user_is_tenant_owner(transportadora_id));

grant execute on function public.user_tenant_role(uuid) to authenticated;

drop policy if exists user_tenant_self on public.user_transportadoras;

create policy user_tenant_self on public.user_transportadoras
  for select to authenticated
  using (
    user_id = auth.uid()
    or transportadora_id in (select public.user_transportadora_ids())
  );

drop policy if exists user_tenant_insert_self on public.user_transportadoras;

create policy user_tenant_insert_self on public.user_transportadoras
  for insert to authenticated
  with check (user_id = auth.uid());
