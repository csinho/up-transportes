-- Console da plataforma: super-admin, status e provisionamento de transportadoras

-- ── Super-admins ─────────────────────────────────────────────────────────────

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create policy platform_admins_self on public.platform_admins
  for select to authenticated
  using (user_id = auth.uid());

-- ── Campos operacionais em transportadoras ───────────────────────────────────

alter table public.transportadoras
  add column if not exists ativa boolean not null default true;

alter table public.transportadoras
  add column if not exists plano text not null default 'trial';

alter table public.transportadoras
  drop constraint if exists transportadoras_plano_check;

alter table public.transportadoras
  add constraint transportadoras_plano_check
  check (plano in ('trial', 'basico', 'profissional'));

alter table public.transportadoras
  add column if not exists trial_ate timestamptz;

alter table public.transportadoras
  add column if not exists criado_por uuid references auth.users (id) on delete set null;

alter table public.transportadoras
  add column if not exists motivo_suspensao text;

update public.transportadoras
set trial_ate = created_at + interval '14 days'
where plano = 'trial' and trial_ate is null;

-- ── Helpers ──────────────────────────────────────────────────────────────────

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.user_transportadora_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select ut.transportadora_id
  from public.user_transportadoras ut
  join public.transportadoras t on t.id = ut.transportadora_id
  where ut.user_id = auth.uid()
    and t.ativa = true;
$$;

-- Bootstrap único: primeiro usuário autenticado vira platform admin se a tabela estiver vazia
create or replace function public.bootstrap_first_platform_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if exists (select 1 from public.platform_admins) then
    return false;
  end if;
  insert into public.platform_admins (user_id) values (auth.uid());
  return true;
end;
$$;

grant execute on function public.bootstrap_first_platform_admin() to authenticated;

-- ── RPC: listagem ────────────────────────────────────────────────────────────

create or replace function public.list_platform_transportadoras()
returns table (
  id uuid,
  nome_fantasia text,
  razao_social text,
  cnpj text,
  ativa boolean,
  plano text,
  trial_ate timestamptz,
  created_at timestamptz,
  total_colaboradores bigint,
  total_viagens bigint,
  owner_email text
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Sem permissão de plataforma';
  end if;

  return query
  select
    t.id,
    t.nome_fantasia,
    t.razao_social,
    nullif(trim(t.dados->>'cnpj'), '') as cnpj,
    t.ativa,
    t.plano,
    t.trial_ate,
    t.created_at,
    (
      select count(*)::bigint
      from public.user_transportadoras ut
      where ut.transportadora_id = t.id
    ) as total_colaboradores,
    (
      select count(*)::bigint
      from public.viagens v
      where v.transportadora_id = t.id
    ) as total_viagens,
    (
      select coalesce(p.email, c.email)
      from public.user_transportadoras ut
      left join public.profiles p on p.id = ut.user_id
      left join lateral (
        select tc.email
        from public.transportadora_convites tc
        where tc.transportadora_id = t.id and tc.role = 'owner'
        order by tc.created_at desc
        limit 1
      ) c on true
      where ut.transportadora_id = t.id and ut.role = 'owner'
      limit 1
    ) as owner_email
  from public.transportadoras t
  order by t.created_at desc;
end;
$$;

grant execute on function public.list_platform_transportadoras() to authenticated;

-- ── RPC: detalhe ─────────────────────────────────────────────────────────────

create or replace function public.get_platform_transportadora(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  t record;
  colaboradores jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Sem permissão de plataforma';
  end if;

  select * into t from public.transportadoras where id = p_id;
  if t is null then
    return null;
  end if;

  select coalesce(jsonb_agg(item order by (item->>'created_at')), '[]'::jsonb)
  into colaboradores
  from (
    select jsonb_build_object(
      'user_id', ut.user_id,
      'email', coalesce(p.email, ''),
      'nome', coalesce(p.nome, ''),
      'role', ut.role,
      'status', 'ativo',
      'created_at', ut.created_at
    ) as item,
    ut.created_at
    from public.user_transportadoras ut
    left join public.profiles p on p.id = ut.user_id
    where ut.transportadora_id = p_id

    union all

    select jsonb_build_object(
      'user_id', null,
      'email', tc.email,
      'nome', split_part(tc.email, '@', 1),
      'role', tc.role,
      'status', 'pendente',
      'created_at', tc.created_at
    ) as item,
    tc.created_at
    from public.transportadora_convites tc
    where tc.transportadora_id = p_id
  ) combined;

  return jsonb_build_object(
    'id', t.id,
    'nome_fantasia', t.nome_fantasia,
    'razao_social', t.razao_social,
    'cnpj', t.dados->>'cnpj',
    'email', t.dados->>'email',
    'telefone_principal', t.dados->>'telefone_principal',
    'ativa', t.ativa,
    'plano', t.plano,
    'trial_ate', t.trial_ate,
    'motivo_suspensao', t.motivo_suspensao,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'total_viagens', (select count(*) from public.viagens v where v.transportadora_id = p_id),
    'total_motoristas', (select count(*) from public.motoristas m where m.transportadora_id = p_id),
    'colaboradores', colaboradores
  );
end;
$$;

grant execute on function public.get_platform_transportadora(uuid) to authenticated;

-- ── RPC: criar transportadora + owner ────────────────────────────────────────

create or replace function public.criar_transportadora_platform(
  p_nome_fantasia text,
  p_razao_social text,
  p_owner_email text,
  p_cnpj text default null,
  p_plano text default 'trial'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_id uuid;
  email_norm text;
  target_uid uuid;
  trial_end timestamptz;
begin
  if not public.is_platform_admin() then
    raise exception 'Sem permissão de plataforma';
  end if;

  if nullif(trim(p_nome_fantasia), '') is null or nullif(trim(p_razao_social), '') is null then
    raise exception 'Nome fantasia e razão social são obrigatórios';
  end if;

  email_norm := lower(trim(p_owner_email));
  if email_norm = '' or email_norm !~ '^[^@]+@[^@]+\.[^@]+$' then
    raise exception 'E-mail do proprietário inválido';
  end if;

  if p_plano not in ('trial', 'basico', 'profissional') then
    raise exception 'Plano inválido';
  end if;

  trial_end := case when p_plano = 'trial' then now() + interval '14 days' else null end;

  insert into public.transportadoras (
    nome_fantasia,
    razao_social,
    dados,
    plano,
    trial_ate,
    criado_por,
    ativa
  )
  values (
    trim(p_nome_fantasia),
    trim(p_razao_social),
    jsonb_strip_nulls(jsonb_build_object('cnpj', nullif(trim(p_cnpj), ''))),
    p_plano,
    trial_end,
    auth.uid(),
    true
  )
  returning id into new_id;

  target_uid := public.find_auth_user_id_by_email(email_norm);

  if target_uid is not null then
    insert into public.user_transportadoras (user_id, transportadora_id, role)
    values (target_uid, new_id, 'owner');
  else
    insert into public.transportadora_convites (transportadora_id, email, role, invited_by)
    values (new_id, email_norm, 'owner', auth.uid());
  end if;

  return new_id;
end;
$$;

grant execute on function public.criar_transportadora_platform(text, text, text, text, text) to authenticated;

-- ── RPC: ativar / inativar ───────────────────────────────────────────────────

create or replace function public.set_transportadora_ativa(
  p_id uuid,
  p_ativa boolean,
  p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Sem permissão de plataforma';
  end if;

  if not exists (select 1 from public.transportadoras where id = p_id) then
    raise exception 'Transportadora não encontrada';
  end if;

  update public.transportadoras
  set
    ativa = p_ativa,
    motivo_suspensao = case when p_ativa then null else nullif(trim(p_motivo), '') end,
    updated_at = now()
  where id = p_id;
end;
$$;

grant execute on function public.set_transportadora_ativa(uuid, boolean, text) to authenticated;

-- ── Motorista: bloquear tenant inativo ───────────────────────────────────────

create or replace function public.link_my_motorista(p_cpf text)
returns table (motorista_id uuid, transportadora_id uuid, nome text)
language plpgsql
security definer
set search_path = public
as $$
declare
  cpf_digits text;
  mid uuid;
  tid uuid;
  mnome text;
  mstatus text;
  tenant_ativa boolean;
begin
  if auth.uid() is null then
    raise exception 'Faça login para continuar.';
  end if;

  cpf_digits := regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g');
  if length(cpf_digits) <> 11 then
    raise exception 'CPF inválido. Informe os 11 dígitos.';
  end if;

  select m.id, m.transportadora_id, m.dados->>'nome', coalesce(m.dados->>'status', 'ativo')
  into mid, tid, mnome, mstatus
  from public.motoristas m
  where regexp_replace(m.dados->>'cpf', '\D', '', 'g') = cpf_digits
  limit 1;

  if mid is null then
    raise exception 'CPF não encontrado. Verifique o número ou fale com a transportadora.';
  end if;

  select t.ativa into tenant_ativa from public.transportadoras t where t.id = tid;
  if tenant_ativa is not true then
    raise exception 'Transportadora suspensa. Contate o suporte.';
  end if;

  if mstatus = 'inativo' then
    raise exception 'Motorista inativo no cadastro.';
  end if;

  if mstatus = 'bloqueado' then
    raise exception 'Motorista bloqueado. Contate a transportadora.';
  end if;

  insert into public.user_motoristas (user_id, motorista_id, transportadora_id)
  values (auth.uid(), mid, tid)
  on conflict (user_id) do update
    set motorista_id = excluded.motorista_id,
        transportadora_id = excluded.transportadora_id;

  motorista_id := mid;
  transportadora_id := tid;
  nome := mnome;
  return next;
end;
$$;
