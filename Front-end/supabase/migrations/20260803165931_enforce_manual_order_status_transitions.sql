-- Enforce the manual lifecycle without changing order inserts used by checkout.

create or replace function private.enforce_manual_order_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (
    (old.status = 'confirmed' and new.status = 'in-production')
    or (old.status = 'in-production' and new.status = 'ready')
    or (old.status = 'ready' and new.status = 'completed')
  ) then
    raise exception 'Orders can only advance through confirmed, in-production, ready, and completed.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_manual_order_status_transition() from public, anon, authenticated;

drop trigger if exists orders_enforce_manual_status_transition on public.orders;
create trigger orders_enforce_manual_status_transition
  before update of status on public.orders
  for each row
  execute function private.enforce_manual_order_status_transition();
