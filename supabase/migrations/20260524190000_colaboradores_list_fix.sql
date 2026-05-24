-- Corrige listagem de colaboradores (sem join auth.users) + e-mail em profiles

alter table public.profiles add column if not exists email text;

-- Sincroniza e-mail no perfil ao criar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(coalesce(new.email, ''), '@', 1)),
    new.email
  )
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        nome = coalesce(excluded.nome, public.profiles.nome);
  return new;
end;
$$;

-- Backfill e-mail dos usuários existentes
update public.profiles p
set email = au.email
from auth.users au
where p.id = au.id
  and (p.email is null or p.email = '');

-- Membros do mesmo tenant podem ver perfil uns dos outros (nome/e-mail na listagem)
drop policy if exists profiles_tenant_members on public.profiles;

create policy profiles_tenant_members on public.profiles
  for select to authenticated
  using (
    id in (
      select ut.user_id
      from public.user_transportadoras ut
      where ut.transportadora_id in (select public.user_transportadora_ids())
    )
  );

-- Lista colaboradores sem acessar auth.users em runtime
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
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if not public.user_has_tenant(p_tid) then
    raise exception 'Sem acesso a esta transportadora';
  end if;

  return query
  select *
  from (
    select
      ut.user_id::text as registro_id,
      ut.user_id,
      coalesce(nullif(trim(p.email), ''), split_part(ut.user_id::text, '-', 1) || '…') as email,
      coalesce(nullif(trim(p.nome), ''), split_part(coalesce(p.email, ''), '@', 1), 'Colaborador') as nome,
      ut.role,
      'ativo'::text as status,
      ut.created_at
    from public.user_transportadoras ut
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
  ) merged
  order by merged.created_at desc;
end;
$$;

grant execute on function public.list_transportadora_colaboradores(uuid) to authenticated;

-- Donos podem inserir convites via RPC; policy extra para leitura direta (fallback no app)
drop policy if exists convites_owner_insert on public.transportadora_convites;

create policy convites_owner_insert on public.transportadora_convites
  for insert to authenticated
  with check (public.user_is_tenant_owner(transportadora_id));

create policy convites_owner_update on public.transportadora_convites
  for update to authenticated
  using (public.user_is_tenant_owner(transportadora_id))
  with check (public.user_is_tenant_owner(transportadora_id));
