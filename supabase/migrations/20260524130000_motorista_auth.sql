-- Auth PWA motorista: login por CPF + RLS escopado às viagens do motorista

create table if not exists public.user_motoristas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  motorista_id uuid not null references public.motoristas (id) on delete cascade,
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_motoristas_motorista
  on public.user_motoristas (motorista_id);

create index if not exists idx_motoristas_cpf_digits
  on public.motoristas ((regexp_replace(dados->>'cpf', '\D', '', 'g')));

-- ── Helpers RLS motorista ─────────────────────────────────────────────────────

create or replace function public.user_motorista_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select motorista_id from public.user_motoristas where user_id = auth.uid() limit 1;
$$;

create or replace function public.user_motorista_transportadora_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select transportadora_id from public.user_motoristas where user_id = auth.uid() limit 1;
$$;

create or replace function public.viagem_do_motorista(vid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.viagens v
    where v.id = vid
      and v.transportadora_id = public.user_motorista_transportadora_id()
      and (v.dados->>'motorista_id')::uuid = public.user_motorista_id()
  );
$$;

create or replace function public.motorista_pode_ver_veiculo(vid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.viagens v
    where public.viagem_do_motorista(v.id)
      and (
        (v.dados->>'veiculo_principal_id')::uuid = vid
        or (v.dados->>'veiculo_reboque_id')::uuid = vid
      )
  );
$$;

create or replace function public.motorista_pode_ver_cliente(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.viagens v
    where public.viagem_do_motorista(v.id)
      and (
        (v.dados->>'cliente_origem_id')::uuid = cid
        or (v.dados->>'cliente_destino_id')::uuid = cid
      )
  );
$$;

-- ── RPC: vincular sessão auth ao motorista pelo CPF ───────────────────────────

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

  return query select mid, tid, mnome;
end;
$$;

grant execute on function public.link_my_motorista(text) to authenticated;

-- ── RLS user_motoristas ───────────────────────────────────────────────────────

alter table public.user_motoristas enable row level security;

create policy user_motoristas_self on public.user_motoristas
  for select using (user_id = auth.uid());

-- ── Políticas adicionais para usuários motorista ──────────────────────────────

create policy motoristas_self on public.motoristas
  for select using (id = public.user_motorista_id());

create policy viagens_motorista on public.viagens
  for all
  using (
    transportadora_id = public.user_motorista_transportadora_id()
    and (dados->>'motorista_id')::uuid = public.user_motorista_id()
  )
  with check (
    transportadora_id = public.user_motorista_transportadora_id()
    and (dados->>'motorista_id')::uuid = public.user_motorista_id()
  );

create policy viagem_eventos_motorista on public.viagem_eventos
  for all
  using (public.viagem_do_motorista(viagem_id))
  with check (
    transportadora_id = public.user_motorista_transportadora_id()
    and public.viagem_do_motorista(viagem_id)
  );

create policy viagem_ocorrencias_motorista on public.viagem_ocorrencias
  for all
  using (public.viagem_do_motorista(viagem_id))
  with check (
    transportadora_id = public.user_motorista_transportadora_id()
    and public.viagem_do_motorista(viagem_id)
  );

create policy viagem_localizacoes_motorista on public.viagem_localizacoes
  for all
  using (public.viagem_do_motorista(viagem_id))
  with check (
    transportadora_id = public.user_motorista_transportadora_id()
    and motorista_id = public.user_motorista_id()
    and public.viagem_do_motorista(viagem_id)
  );

create policy veiculos_motorista on public.veiculos
  for select using (public.motorista_pode_ver_veiculo(id));

create policy clientes_motorista on public.clientes
  for select using (public.motorista_pode_ver_cliente(id));
