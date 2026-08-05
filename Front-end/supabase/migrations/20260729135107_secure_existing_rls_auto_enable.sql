-- Reconcile an inherited hosted-development security advisor finding.
--
-- The function is an event-trigger helper that enables RLS on new public
-- tables. It is not present in a clean local stack, so this migration is
-- conditional. When present, browser-facing roles must not execute this
-- SECURITY DEFINER function.
do $migration$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute
      'revoke execute on function public.rls_auto_enable() '
      'from public, anon, authenticated';
  end if;
end
$migration$;
