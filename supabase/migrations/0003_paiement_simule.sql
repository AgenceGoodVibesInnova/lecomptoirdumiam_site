-- Commandes payées en mode simulé (avant le branchement de SumUp) : jamais de vrai numéro de facture.
alter table public.orders add column if not exists is_demo boolean not null default false;

create or replace function public.assign_invoice_number(p_order uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare n text; demo boolean; num bigint;
begin
  select invoice_number, is_demo, number into n, demo, num from public.orders where id = p_order;
  if n is not null then return n; end if;
  if demo then
    n := 'ESSAI-' || num;   -- hors numérotation officielle
  else
    n := 'FA-' || to_char(now() at time zone 'Europe/Paris', 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 5, '0');
  end if;
  update public.orders set invoice_number = n, invoiced_at = now() where id = p_order;
  return n;
end;
$$;
revoke all on function public.assign_invoice_number(uuid) from public, anon, authenticated;
grant execute on function public.assign_invoice_number(uuid) to service_role;
