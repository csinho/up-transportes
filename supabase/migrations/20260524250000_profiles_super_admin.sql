-- Super-admin: flag em profiles (fonte única). Substitui platform_admins.

alter table public.profiles
  add column if not exists is_super_admin boolean not null default false;

-- Migra admins legados
update public.profiles p
set is_super_admin = true
from public.platform_admins pa
where p.id = pa.user_id;

-- Impede auto-promoção via API (updates do próprio usuário)
create or replace function public.profiles_guard_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('app.internal_super_admin_grant', true), '') = '1' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is not null and new.id = auth.uid() and new.is_super_admin is true then
      new.is_super_admin := false;
    end if;
    return new;
  end if;

  if new.is_super_admin is distinct from old.is_super_admin then
    if auth.uid() is not null and new.id = auth.uid() then
      new.is_super_admin := old.is_super_admin;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_super_admin on public.profiles;
create trigger profiles_guard_super_admin
  before insert or update on public.profiles
  for each row execute function public.profiles_guard_super_admin();

-- Novos usuários nunca nascem super-admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, is_super_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    false
  )
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        nome = coalesce(excluded.nome, public.profiles.nome);
  return new;
end;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_super_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

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

  if exists (select 1 from public.profiles where is_super_admin = true) then
    return false;
  end if;

  perform set_config('app.internal_super_admin_grant', '1', true);

  update public.profiles
  set is_super_admin = true
  where id = auth.uid();

  if not found then
    insert into public.profiles (id, is_super_admin)
    values (auth.uid(), true);
  end if;

  perform set_config('app.internal_super_admin_grant', '', true);
  return true;
end;
$$;


-- Tabela legada (substituída por profiles.is_super_admin)
drop policy if exists platform_admins_self on public.platform_admins;
drop table if exists public.platform_admins;
