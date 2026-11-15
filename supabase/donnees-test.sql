-- Données de test pour travailler l'interface d'administration.
-- Tout est rattaché à la catégorie masquée « TEST (masqué) » (invisible sur la carte publique)
-- et aux produits de stock dont le nom finit par « · test ».
-- Pour tout supprimer : supabase/nettoyage-test.sql

-- Carte de test (catégorie inactive = invisible pour les visiteurs)
with cat as (
  insert into public.menu_categories (name, moment, position, active)
  values ('TEST (masqué)', 'Données de test', 99, false)
  returning id
)
insert into public.menu_items (category_id, name, description, price_cents, position)
select cat.id, v.name, 'Article de test', v.price, v.pos
from cat, (values
  ('Formule brunch', 1650, 1), ('Croque du jour', 950, 2), ('Plat du jour', 1800, 3),
  ('Burger du Miam', 1550, 4), ('Salade de saison', 1300, 5), ('Dessert maison', 650, 6),
  ('Glace 2 boules', 450, 7), ('Café', 220, 8), ('Jus pressé', 450, 9), ('Baguette', 130, 10)
) as v(name, price, pos);

-- Stocks de test (deux produits sous le seuil d'alerte)
insert into public.stock_items (name, section, unit, quantity, alert_threshold) values
  ('Pâtes · test', 'sec', 'paquet', 24, 6),
  ('Conserves de thon · test', 'sec', 'boîte', 4, 6),
  ('Biscuits apéro · test', 'sec', 'paquet', 15, 5),
  ('Lait demi-écrémé · test', 'frais', 'litre', 2, 8),
  ('Yaourts nature · test', 'frais', 'pack', 12, 4),
  ('Fruits de saison · test', 'frais', 'kg', 9, 3),
  ('Glaces en pot · test', 'surgele', 'pot', 18, 5),
  ('Frites surgelées · test', 'surgele', 'sac', 7, 3);

-- 40 commandes payées : 3 nouvelles, 2 en préparation, 1 prête, 1 annulée, le reste terminées
do $$
declare
  i int; o uuid; m text; st text; ts timestamptz; it record; k int; tot int; cat_id uuid;
begin
  select id into cat_id from public.menu_categories where name = 'TEST (masqué)';
  for i in 1..40 loop
    m := (array['mobilhome', 'emporter', 'table'])[1 + floor(random() * 3)::int];
    st := 'terminee';
    ts := now() - make_interval(mins => (60 + floor(random() * 14 * 24 * 60))::int);
    if i <= 3 then st := 'nouvelle'; ts := now() - make_interval(mins => i * 4);
    elsif i <= 5 then st := 'en_preparation'; ts := now() - make_interval(mins => i * 6);
    elsif i = 6 then st := 'prete'; ts := now() - make_interval(mins => 25);
    elsif i = 7 then st := 'annulee';
    end if;

    insert into public.orders (mode, location, note, status, total_cents, paid_at, created_at)
    values (
      m,
      case m when 'mobilhome' then 'MH ' || (1 + floor(random() * 80))::int
             when 'table' then 'Table ' || (1 + floor(random() * 12))::int
             else to_char((ts + interval '20 minutes') at time zone 'Europe/Paris', 'HH24:MI') end,
      case when i in (2, 12) then 'Sans gluten svp' when i = 4 then 'Allergie fruits à coque' else null end,
      st, 0, ts, ts
    ) returning id into o;

    tot := 0;
    for it in
      select id, name, price_cents from public.menu_items
      where category_id = cat_id order by random() limit (1 + floor(random() * 3))::int
    loop
      k := 1 + floor(random() * 3)::int;
      insert into public.order_items (order_id, menu_item_id, name, unit_price_cents, quantity)
      values (o, it.id, it.name, it.price_cents, k);
      tot := tot + it.price_cents * k;
    end loop;
    update public.orders set total_cents = tot where id = o;
  end loop;
end $$;

select status, count(*) from public.orders group by status order by 1;
