-- Tenant inicial para bootstrap do ERP + Storage para usuários motorista

-- ── Transportadora inicial (primeiro login ERP vincula via link_my_transportadora) ─

insert into public.transportadoras (id, nome_fantasia, razao_social, dados)
values (
  'a1000001-0001-4001-8001-000000000001',
  'Rodoviário Sul Cargas',
  'Rodoviário Sul Transportes Ltda',
  jsonb_build_object(
    'tipo_transportador', 'etc',
    'documentos', '[]'::jsonb
  )
)
on conflict (id) do nothing;

-- ── Storage: motoristas autenticados (auth anônima + user_motoristas) ─────────

drop policy if exists documentos_motorista_select on storage.objects;
drop policy if exists documentos_motorista_insert on storage.objects;
drop policy if exists documentos_motorista_update on storage.objects;
drop policy if exists documentos_motorista_delete on storage.objects;

create policy documentos_motorista_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid = public.user_motorista_transportadora_id()
  );

create policy documentos_motorista_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid = public.user_motorista_transportadora_id()
  );

create policy documentos_motorista_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid = public.user_motorista_transportadora_id()
  );

create policy documentos_motorista_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1]::uuid = public.user_motorista_transportadora_id()
  );
