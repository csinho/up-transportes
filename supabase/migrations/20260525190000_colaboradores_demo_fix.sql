-- Corrige e-mails na listagem de colaboradores e impede auto-atribuição de owner.

-- Sincroniza e-mail em profiles (backfill idempotente)
update public.profiles p
set email = au.email
from auth.users au
where p.id = au.id
  and au.email is not null
  and trim(au.email) <> ''
  and (p.email is null or trim(p.email) = '');

-- Lista colaboradores: usa auth.users quando profiles.email estiver vazio
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
  select *
  from (
    select
      ut.user_id::text as registro_id,
      ut.user_id,
      coalesce(
        nullif(trim(p.email), ''),
        nullif(trim(au.email), ''),
        'Usuário sem e-mail'
      ) as email,
      coalesce(
        nullif(trim(p.nome), ''),
        split_part(coalesce(nullif(trim(p.email), ''), nullif(trim(au.email), ''), ''), '@', 1),
        'Colaborador'
      ) as nome,
      ut.role,
      'ativo'::text as status,
      ut.created_at
    from public.user_transportadoras ut
    left join public.profiles p on p.id = ut.user_id
    left join auth.users au on au.id = ut.user_id
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

-- Impede que usuários se auto-atribuam como proprietário (só convite ou plataforma)
create or replace function public.link_my_transportadora(tid uuid, p_role text default 'operador')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if p_role not in ('owner', 'operador') then
    raise exception 'Role inválida';
  end if;
  if p_role = 'owner' then
    raise exception 'Não é permitido auto-atribuir proprietário';
  end if;
  if not exists (select 1 from public.transportadoras where id = tid) then
    raise exception 'Transportadora não encontrada';
  end if;
  insert into public.user_transportadoras (user_id, transportadora_id, role)
  values (auth.uid(), tid, p_role)
  on conflict (user_id, transportadora_id) do update set role = excluded.role;
end;
$$;

grant execute on function public.link_my_transportadora(uuid, text) to authenticated;

-- Limpa vínculos fantasma na transportadora demo (bootstrap legado em produção)
update public.user_transportadoras ut
set role = 'operador'
where ut.transportadora_id = 'a1000001-0001-4001-8001-000000000001'
  and ut.role = 'owner'
  and ut.user_id in (
    select p.id
    from public.profiles p
    left join auth.users au on au.id = p.id
    where coalesce(nullif(trim(p.email), ''), nullif(trim(au.email), '')) is null
  );
