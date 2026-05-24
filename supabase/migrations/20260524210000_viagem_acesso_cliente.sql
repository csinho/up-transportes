-- Link de acompanhamento para clientes (visualizador externo — uma viagem por link)

create table if not exists public.viagem_acessos_cliente (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  titulo text,
  ativo boolean not null default true,
  expires_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_viagem_acessos_cliente_viagem
  on public.viagem_acessos_cliente (viagem_id);

create or replace function public.user_pode_operar_tenant(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.user_tenant_role(tid) in ('owner', 'operador'), false);
$$;

grant execute on function public.user_pode_operar_tenant(uuid) to authenticated;

-- Criar ou reativar link de acompanhamento (owner + operador)
create or replace function public.criar_acesso_cliente_viagem(
  p_viagem_id uuid,
  p_titulo text default null
)
returns table (token uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  existing uuid;
  out_token uuid;
  out_created_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select v.transportadora_id into tid from public.viagens v where v.id = p_viagem_id;
  if tid is null then
    raise exception 'Viagem não encontrada';
  end if;
  if not public.user_pode_operar_tenant(tid) then
    raise exception 'Sem permissão para gerar link de cliente';
  end if;

  select a.id into existing
  from public.viagem_acessos_cliente a
  where a.viagem_id = p_viagem_id and a.ativo = true
  limit 1;

  if existing is not null then
    update public.viagem_acessos_cliente
    set titulo = coalesce(nullif(trim(p_titulo), ''), titulo),
        ativo = true,
        expires_at = null
    where id = existing
    returning viagem_acessos_cliente.token, viagem_acessos_cliente.created_at
    into out_token, out_created_at;
  else
    insert into public.viagem_acessos_cliente (transportadora_id, viagem_id, titulo, created_by)
    values (tid, p_viagem_id, nullif(trim(p_titulo), ''), auth.uid())
    returning viagem_acessos_cliente.token, viagem_acessos_cliente.created_at
    into out_token, out_created_at;
  end if;

  token := out_token;
  created_at := out_created_at;
  return next;
end;
$$;

grant execute on function public.criar_acesso_cliente_viagem(uuid, text) to authenticated;

create or replace function public.revogar_acesso_cliente_viagem(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select a.transportadora_id into tid
  from public.viagem_acessos_cliente a
  where a.token = p_token;

  if tid is null then
    raise exception 'Link não encontrado';
  end if;
  if not public.user_pode_operar_tenant(tid) then
    raise exception 'Sem permissão';
  end if;

  update public.viagem_acessos_cliente set ativo = false where token = p_token;
end;
$$;

grant execute on function public.revogar_acesso_cliente_viagem(uuid) to authenticated;

create or replace function public.list_acessos_cliente_viagem(p_viagem_id uuid)
returns table (
  token uuid,
  titulo text,
  ativo boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  select v.transportadora_id into tid from public.viagens v where v.id = p_viagem_id;
  if tid is null then
    raise exception 'Viagem não encontrada';
  end if;
  if not public.user_has_tenant(tid) then
    raise exception 'Sem acesso';
  end if;

  return query
  select a.token, a.titulo, a.ativo, a.created_at
  from public.viagem_acessos_cliente a
  where a.viagem_id = p_viagem_id
  order by a.created_at desc;
end;
$$;

grant execute on function public.list_acessos_cliente_viagem(uuid) to authenticated;

-- Dados públicos de acompanhamento (anon — só com token válido)
create or replace function public.get_acompanhamento_cliente(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  acc record;
  v record;
  locs jsonb;
  co_nome text;
  cd_nome text;
begin
  select a.* into acc
  from public.viagem_acessos_cliente a
  where a.token = p_token
    and a.ativo = true
    and (a.expires_at is null or a.expires_at > now());

  if acc is null then
    return jsonb_build_object('valido', false);
  end if;

  select v.*, t.nome_fantasia, nullif(trim(t.dados->>'logo_url'), '') as logo_url
  into v
  from public.viagens v
  join public.transportadoras t on t.id = v.transportadora_id
  where v.id = acc.viagem_id;

  if v is null then
    return jsonb_build_object('valido', false);
  end if;

  select c.dados->>'nome' into co_nome
  from public.clientes c
  where c.id = (v.dados->>'cliente_origem_id')::uuid;

  select c.dados->>'nome' into cd_nome
  from public.clientes c
  where c.id = (v.dados->>'cliente_destino_id')::uuid;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'latitude', l.latitude,
      'longitude', l.longitude,
      'velocidade_kmh', l.velocidade_kmh,
      'registrado_em', l.registrado_em
    ) order by l.registrado_em
  ), '[]'::jsonb)
  into locs
  from public.viagem_localizacoes l
  where l.viagem_id = acc.viagem_id;

  return jsonb_build_object(
    'valido', true,
    'token', acc.token,
    'transportadora', jsonb_build_object(
      'nome_fantasia', v.nome_fantasia,
      'logo_url', v.logo_url
    ),
    'viagem', jsonb_build_object(
      'id', v.id,
      'transportadora_id', v.transportadora_id,
      'numero_viagem', v.numero_viagem,
      'status', v.status,
      'dados', v.dados,
      'created_at', v.created_at,
      'updated_at', v.updated_at
    ),
    'cliente_origem_nome', coalesce(co_nome, v.dados->'endereco_origem'->>'cidade'),
    'cliente_destino_nome', coalesce(cd_nome, v.dados->'endereco_destino'->>'cidade'),
    'localizacoes', locs
  );
end;
$$;

grant execute on function public.get_acompanhamento_cliente(uuid) to anon, authenticated;

alter table public.viagem_acessos_cliente enable row level security;

drop policy if exists viagem_acessos_cliente_tenant on public.viagem_acessos_cliente;
create policy viagem_acessos_cliente_tenant on public.viagem_acessos_cliente
  for select to authenticated
  using (transportadora_id in (select public.user_transportadora_ids()));
