-- Corrige get_acompanhamento_cliente: conflito de alias "v" com variável PL/pgSQL
-- e cast seguro de UUID nos clientes da viagem.

create or replace function public.safe_uuid_from_text(p text)
returns uuid
language plpgsql
immutable
as $$
begin
  if p is null or btrim(p) = '' then
    return null;
  end if;
  return p::uuid;
exception
  when others then
    return null;
end;
$$;

grant execute on function public.safe_uuid_from_text(text) to anon, authenticated;

create or replace function public.get_acompanhamento_cliente(p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  acc record;
  viagem_row record;
  locs jsonb;
  co_nome text;
  cd_nome text;
  co_id uuid;
  cd_id uuid;
begin
  select a.* into acc
  from public.viagem_acessos_cliente a
  where a.token = p_token
    and a.ativo = true
    and (a.expires_at is null or a.expires_at > now());

  if acc is null then
    return jsonb_build_object('valido', false);
  end if;

  select
    vg.id,
    vg.transportadora_id,
    vg.numero_viagem,
    vg.status,
    vg.dados,
    vg.created_at,
    vg.updated_at,
    t.nome_fantasia,
    nullif(btrim(t.dados->>'logo_url'), '') as logo_url
  into viagem_row
  from public.viagens vg
  join public.transportadoras t on t.id = vg.transportadora_id
  where vg.id = acc.viagem_id;

  if viagem_row is null then
    return jsonb_build_object('valido', false);
  end if;

  co_id := public.safe_uuid_from_text(viagem_row.dados->>'cliente_origem_id');
  cd_id := public.safe_uuid_from_text(viagem_row.dados->>'cliente_destino_id');

  if co_id is not null then
    select c.dados->>'nome' into co_nome
    from public.clientes c
    where c.id = co_id;
  end if;

  if cd_id is not null then
    select c.dados->>'nome' into cd_nome
    from public.clientes c
    where c.id = cd_id;
  end if;

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
      'nome_fantasia', viagem_row.nome_fantasia,
      'logo_url', viagem_row.logo_url
    ),
    'viagem', jsonb_build_object(
      'id', viagem_row.id,
      'transportadora_id', viagem_row.transportadora_id,
      'numero_viagem', viagem_row.numero_viagem,
      'status', viagem_row.status,
      'dados', viagem_row.dados,
      'created_at', viagem_row.created_at,
      'updated_at', viagem_row.updated_at
    ),
    'cliente_origem_nome', coalesce(co_nome, viagem_row.dados->'endereco_origem'->>'cidade'),
    'cliente_destino_nome', coalesce(cd_nome, viagem_row.dados->'endereco_destino'->>'cidade'),
    'localizacoes', locs
  );
end;
$$;

grant execute on function public.get_acompanhamento_cliente(uuid) to anon, authenticated;
