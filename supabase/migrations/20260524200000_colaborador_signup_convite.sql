-- Permite cadastro público apenas para e-mails com convite pendente

create or replace function public.email_pode_cadastrar_colaborador(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.transportadora_convites c
    where lower(c.email) = lower(trim(p_email))
  );
$$;

grant execute on function public.email_pode_cadastrar_colaborador(text) to anon, authenticated;
