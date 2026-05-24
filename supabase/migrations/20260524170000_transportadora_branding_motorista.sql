-- Branding da transportadora no PWA motorista (login + dashboard)

-- Motorista autenticado pode ler a própria transportadora
create policy transportadoras_motorista_select on public.transportadoras
  for select to authenticated
  using (id = public.user_motorista_transportadora_id());

-- Branding público (nome + logo) para tela de login antes do vínculo por CPF
create or replace function public.get_transportadora_branding(p_id uuid)
returns table (id uuid, nome_fantasia text, logo_url text)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.nome_fantasia,
    nullif(trim(t.dados->>'logo_url'), '')
  from public.transportadoras t
  where t.id = p_id;
$$;

grant execute on function public.get_transportadora_branding(uuid) to anon, authenticated;

-- Logo no Storage: leitura pública (apenas arquivos logo.* em transportadoras/)
create policy documentos_logo_public_read on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'documentos'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/transportadoras/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/logo\.'
  );
