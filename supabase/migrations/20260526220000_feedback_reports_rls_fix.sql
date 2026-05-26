-- Corrige envio de feedback: SELECT próprio registro (necessário para .select() pós-insert
-- e para validação RLS ao inserir feedback_anexos).

drop policy if exists feedback_reports_select_own on public.feedback_reports;

create policy feedback_reports_select_own on public.feedback_reports
  for select to authenticated
  using (
    user_id = auth.uid()
    and transportadora_id in (select public.user_transportadora_ids())
  );
