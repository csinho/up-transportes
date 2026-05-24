-- ERP Transportadoras — schema inicial + RLS multi-tenant
-- Aplicar: supabase db push  OU  supabase migration up

-- ── Perfis e vínculo usuário ↔ transportadora ───────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  created_at timestamptz not null default now()
);

create table if not exists public.transportadoras (
  id uuid primary key default gen_random_uuid(),
  nome_fantasia text not null,
  razao_social text not null,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_transportadoras (
  user_id uuid not null references auth.users (id) on delete cascade,
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  role text not null default 'operador'
    check (role in ('owner', 'operador', 'visualizador')),
  created_at timestamptz not null default now(),
  primary key (user_id, transportadora_id)
);

create index if not exists idx_user_transportadoras_tenant
  on public.user_transportadoras (transportadora_id);

-- ── Cadastros de apoio (payload flexível em JSON até migração campo a campo) ─

create table if not exists public.motoristas (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Viagens e operação ───────────────────────────────────────────────────────

create table if not exists public.viagens (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  numero_viagem integer not null,
  status text not null,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (transportadora_id, numero_viagem)
);

create table if not exists public.viagem_eventos (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.viagem_ocorrencias (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.viagem_localizacoes (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  motorista_id uuid references public.motoristas (id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  velocidade_kmh double precision,
  precisao_metros double precision,
  heading double precision,
  registrado_em timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_viagens_tenant_status on public.viagens (transportadora_id, status);
create index if not exists idx_viagem_loc_viagem on public.viagem_localizacoes (viagem_id, registrado_em desc);
create index if not exists idx_viagem_loc_tenant on public.viagem_localizacoes (transportadora_id, registrado_em desc);

-- Realtime no mapa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'viagem_localizacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.viagem_localizacoes;
  END IF;
END $$;

-- ── RLS helpers ──────────────────────────────────────────────────────────────

create or replace function public.user_transportadora_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select transportadora_id
  from public.user_transportadoras
  where user_id = auth.uid();
$$;

create or replace function public.user_has_tenant(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_transportadoras
    where user_id = auth.uid() and transportadora_id = tid
  );
$$;

-- ── RLS policies ─────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.user_transportadoras enable row level security;
alter table public.transportadoras enable row level security;
alter table public.motoristas enable row level security;
alter table public.veiculos enable row level security;
alter table public.clientes enable row level security;
alter table public.produtos enable row level security;
alter table public.viagens enable row level security;
alter table public.viagem_eventos enable row level security;
alter table public.viagem_ocorrencias enable row level security;
alter table public.viagem_localizacoes enable row level security;

-- profiles: próprio usuário
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- user_transportadoras: ver próprios vínculos
create policy user_tenant_self on public.user_transportadoras
  for select using (user_id = auth.uid());

-- transportadoras: tenants do usuário
create policy transportadoras_tenant on public.transportadoras
  for all using (id in (select public.user_transportadora_ids()))
  with check (id in (select public.user_transportadora_ids()));

-- macro policy helper for tenant tables
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'motoristas', 'veiculos', 'clientes', 'produtos',
    'viagens', 'viagem_eventos', 'viagem_ocorrencias', 'viagem_localizacoes'
  ]
  loop
    execute format(
      'create policy %I_tenant on public.%I for all
       using (transportadora_id in (select public.user_transportadora_ids()))
       with check (transportadora_id in (select public.user_transportadora_ids()))',
      tbl, tbl
    );
  end loop;
end $$;

-- ── Storage: bucket documentos (privado) ─────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 52428800)
on conflict (id) do nothing;

create policy documentos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid in (select public.user_transportadora_ids())
  );

create policy documentos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid in (select public.user_transportadora_ids())
  );

create policy documentos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid in (select public.user_transportadora_ids())
  );

create policy documentos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid in (select public.user_transportadora_ids())
  );

-- ── Trigger: perfil ao cadastrar usuário ─────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
