-- Feedback / reporte de bugs do ERP

-- ── Bucket: aumentar limite para 100 MB ──────────────────────────────────────

update storage.buckets
set file_size_limit = 104857600
where id = 'documentos';

-- ── Tabelas ──────────────────────────────────────────────────────────────────

create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text,
  user_nome text,
  titulo text not null,
  descricao text not null,
  impacto text not null check (impacto in ('baixo', 'medio', 'alto', 'critico')),
  status text not null default 'aberto' check (status in ('aberto', 'em_analise', 'resolvido', 'fechado')),
  pagina_url text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_reports_transportadora
  on public.feedback_reports (transportadora_id, created_at desc);

create table if not exists public.feedback_anexos (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback_reports (id) on delete cascade,
  storage_path text not null,
  nome_arquivo text not null,
  mime_type text,
  tamanho_bytes bigint,
  tipo text not null check (tipo in ('arquivo', 'gravacao')),
  duracao_segundos int,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_anexos_feedback
  on public.feedback_anexos (feedback_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.feedback_reports enable row level security;
alter table public.feedback_anexos enable row level security;

create policy feedback_reports_insert on public.feedback_reports
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and transportadora_id in (select public.user_transportadora_ids())
  );

create policy feedback_anexos_insert on public.feedback_anexos
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.feedback_reports fr
      where fr.id = feedback_id
        and fr.user_id = auth.uid()
        and fr.transportadora_id in (select public.user_transportadora_ids())
    )
  );

-- Platform admin: leitura de arquivos de feedback no storage
create policy documentos_platform_admin_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and public.is_platform_admin()
  );

-- ── RPC: listagem plataforma ─────────────────────────────────────────────────

create or replace function public.list_platform_feedback(p_transportadora_id uuid)
returns table (
  id uuid,
  titulo text,
  impacto text,
  status text,
  user_email text,
  user_nome text,
  total_anexos bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Sem permissão de plataforma';
  end if;

  return query
  select
    fr.id,
    fr.titulo,
    fr.impacto,
    fr.status,
    fr.user_email,
    fr.user_nome,
    count(fa.id) as total_anexos,
    fr.created_at
  from public.feedback_reports fr
  left join public.feedback_anexos fa on fa.feedback_id = fr.id
  where fr.transportadora_id = p_transportadora_id
  group by fr.id
  order by fr.created_at desc;
end;
$$;

grant execute on function public.list_platform_feedback(uuid) to authenticated;

-- ── RPC: detalhe plataforma ──────────────────────────────────────────────────

create or replace function public.get_platform_feedback(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'Sem permissão de plataforma';
  end if;

  select jsonb_build_object(
    'id', fr.id,
    'transportadora_id', fr.transportadora_id,
    'user_id', fr.user_id,
    'user_email', fr.user_email,
    'user_nome', fr.user_nome,
    'titulo', fr.titulo,
    'descricao', fr.descricao,
    'impacto', fr.impacto,
    'status', fr.status,
    'pagina_url', fr.pagina_url,
    'user_agent', fr.user_agent,
    'created_at', fr.created_at,
    'anexos', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', fa.id,
            'storage_path', fa.storage_path,
            'nome_arquivo', fa.nome_arquivo,
            'mime_type', fa.mime_type,
            'tamanho_bytes', fa.tamanho_bytes,
            'tipo', fa.tipo,
            'duracao_segundos', fa.duracao_segundos,
            'created_at', fa.created_at
          )
          order by fa.created_at
        )
        from public.feedback_anexos fa
        where fa.feedback_id = fr.id
      ),
      '[]'::jsonb
    )
  )
  into result
  from public.feedback_reports fr
  where fr.id = p_id;

  if result is null then
    raise exception 'Feedback não encontrado';
  end if;

  return result;
end;
$$;

grant execute on function public.get_platform_feedback(uuid) to authenticated;

-- ── RPC: atualizar status ──────────────────────────────────────────────────────

create or replace function public.update_platform_feedback_status(
  p_id uuid,
  p_status text
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

  if p_status not in ('aberto', 'em_analise', 'resolvido', 'fechado') then
    raise exception 'Status inválido';
  end if;

  update public.feedback_reports
  set status = p_status
  where id = p_id;

  if not found then
    raise exception 'Feedback não encontrado';
  end if;
end;
$$;

grant execute on function public.update_platform_feedback_status(uuid, text) to authenticated;
