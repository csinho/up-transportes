-- Permite ao usuário autenticado vincular-se a uma transportadora (bootstrap inicial)
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
  if p_role not in ('owner', 'operador', 'visualizador') then
    raise exception 'Role inválida';
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

create policy user_tenant_insert_self on public.user_transportadoras
  for insert to authenticated
  with check (user_id = auth.uid());
