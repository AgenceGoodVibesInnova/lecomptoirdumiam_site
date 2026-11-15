-- Le Comptoir du Miam : prix d'achat, TVA, coûts de revient, factures, coordonnées client sur les commandes.
-- Migration additive : ne supprime rien.

-- Stocks : prix d'achat HT, TVA, prix de vente, fournisseur
alter table public.stock_items
  add column if not exists purchase_price_cents int check (purchase_price_cents >= 0),
  add column if not exists vat_rate numeric not null default 5.5,
  add column if not exists sale_price_cents int check (sale_price_cents >= 0),
  add column if not exists supplier text;

-- Carte : TVA et coût de revient HT
alter table public.menu_items
  add column if not exists vat_rate numeric not null default 10,
  add column if not exists cost_cents int check (cost_cents >= 0);

-- Commandes : coordonnées du client figées au moment de la commande, numéro de facture
alter table public.orders
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists invoice_number text unique,
  add column if not exists invoiced_at timestamptz;

alter table public.order_items
  add column if not exists vat_rate numeric not null default 10;

create sequence if not exists public.invoice_seq start 1;

-- Attribue un numéro de facture continu (FA-2027-00001…), une seule fois par commande
create or replace function public.assign_invoice_number(p_order uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare n text;
begin
  select invoice_number into n from public.orders where id = p_order;
  if n is not null then return n; end if;
  n := 'FA-' || to_char(now() at time zone 'Europe/Paris', 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 5, '0');
  update public.orders set invoice_number = n, invoiced_at = now() where id = p_order;
  return n;
end;
$$;
revoke all on function public.assign_invoice_number(uuid) from public, anon, authenticated;
grant execute on function public.assign_invoice_number(uuid) to service_role;

-- Profils : téléphone déjà présent ; mention de création par l'équipe
alter table public.profiles
  add column if not exists created_by_staff boolean not null default false;

-- Réglages : mentions légales pour les factures
alter table public.settings
  add column if not exists legal_name text,
  add column if not exists legal_address text,
  add column if not exists siret text,
  add column if not exists vat_number text,
  add column if not exists invoice_footer text;

-- Les données de test reçoivent des noms de clients fictifs, pour travailler l'interface
update public.orders o
   set customer_name = (array['Camille Martin','Julien Robert','Sophie Lefèvre','Léa Fontaine','Thomas Girard','Marc Dubois','Inès Moreau','Hugo Bernard'])[1 + floor(random() * 8)::int]
 where customer_name is null and user_id is null and exists (
   select 1 from public.order_items oi
   join public.menu_items mi on mi.id = oi.menu_item_id
   join public.menu_categories c on c.id = mi.category_id
   where oi.order_id = o.id and c.name = 'TEST (masqué)'
 );

-- Prix d'achat de test sur les produits de stock de test
update public.stock_items set purchase_price_cents = (80 + floor(random() * 300))::int, sale_price_cents = (200 + floor(random() * 500))::int
 where name like '% · test' and purchase_price_cents is null;
update public.menu_items mi set cost_cents = round(price_cents * (0.25 + random() * 0.15))::int
  from public.menu_categories c where c.id = mi.category_id and c.name = 'TEST (masqué)' and mi.cost_cents is null;
