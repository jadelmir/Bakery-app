-- Atomically settle a manual order's full balance for an authorized bakery member.

create or replace function public.mark_order_paid(
  p_bakery_id uuid,
  p_order_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not private.is_bakery_member(p_bakery_id) then
    raise exception 'Access denied: caller is not a member of bakery %', p_bakery_id
      using errcode = '42501';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
    and bakery_id = p_bakery_id
  for update;

  if not found then
    raise exception 'Order not found in the active bakery.' using errcode = '22023';
  end if;

  if v_order.total_cents < 0 then
    raise exception 'Order total cannot be negative.' using errcode = '22023';
  end if;

  if v_order.amount_paid_cents <> v_order.total_cents
     or v_order.payment_status <> 'paid' then
    update public.orders
    set amount_paid_cents = total_cents,
        payment_status = 'paid',
        updated_at = now()
    where id = p_order_id
      and bakery_id = p_bakery_id
    returning * into v_order;
  end if;

  return jsonb_build_object(
    'order_id', v_order.id,
    'amount_paid_cents', v_order.amount_paid_cents,
    'payment_status', v_order.payment_status,
    'status', v_order.status
  );
end;
$$;

revoke all on function public.mark_order_paid(uuid, uuid) from public, anon;
grant execute on function public.mark_order_paid(uuid, uuid) to authenticated, service_role;
