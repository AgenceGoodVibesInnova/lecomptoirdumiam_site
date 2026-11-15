-- Supprime toutes les données créées par supabase/donnees-test.sql

delete from public.orders o
where exists (
  select 1 from public.order_items oi
  join public.menu_items mi on mi.id = oi.menu_item_id
  join public.menu_categories c on c.id = mi.category_id
  where oi.order_id = o.id and c.name = 'TEST (masqué)'
);

delete from public.menu_categories where name = 'TEST (masqué)';  -- supprime aussi ses articles
delete from public.stock_items where name like '% · test';

-- Carte et stocks d'exemple (supabase/produits-demo.sql)
delete from public.menu_items where is_demo;
delete from public.stock_items where is_demo;

-- Commandes passées avec le paiement simulé
delete from public.orders where is_demo;
