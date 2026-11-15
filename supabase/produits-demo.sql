-- Carte et stocks d'exemple (produits fictifs) pour travailler le site et l'admin.
-- Tout est marqué is_demo = true. Pour tout supprimer : supabase/nettoyage-test.sql

alter table public.menu_items add column if not exists is_demo boolean not null default false;
alter table public.stock_items add column if not exists is_demo boolean not null default false;

-- Stocks de l'épicerie
insert into public.stock_items (name, section, unit, quantity, alert_threshold, purchase_price_cents, vat_rate, sale_price_cents, supplier, is_demo) values
  ('Baguette tradition', 'sec', 'pièce', 40, 15, 55, 5.5, 130, 'Boulangerie partenaire', true),
  ('Pâtes 500 g', 'sec', 'paquet', 24, 8, 80, 5.5, 190, 'Grossiste alimentaire', true),
  ('Café moulu 250 g', 'sec', 'paquet', 10, 4, 240, 5.5, 490, 'Torréfacteur local', true),
  ('Confiture artisanale', 'sec', 'pot', 3, 4, 280, 5.5, 550, 'Producteur local', true),
  ('Chips 150 g', 'sec', 'paquet', 30, 10, 95, 5.5, 250, 'Grossiste alimentaire', true),
  ('Eau minérale 1,5 L', 'sec', 'bouteille', 48, 12, 35, 5.5, 120, 'Grossiste boissons', true),
  ('Rosé local 75 cl', 'sec', 'bouteille', 12, 6, 550, 20, 1200, 'Domaine viticole', true),
  ('Lait demi-écrémé 1 L', 'frais', 'bouteille', 5, 8, 85, 5.5, 160, 'Laiterie locale', true),
  ('Œufs fermiers x6', 'frais', 'boîte', 14, 6, 160, 5.5, 320, 'Ferme partenaire', true),
  ('Beurre doux 250 g', 'frais', 'plaquette', 9, 4, 190, 5.5, 380, 'Laiterie locale', true),
  ('Glace vanille 500 ml', 'surgele', 'pot', 16, 5, 290, 5.5, 650, 'Glacier artisanal', true),
  ('Frites surgelées 2,5 kg', 'surgele', 'sac', 6, 3, 520, 5.5, null, 'Grossiste alimentaire', true);

-- Carte : (catégorie, nom, description, prix TTC, TVA, coût de revient HT, position, produit de stock lié)
with v(cat, name, descr, price, vat, cost, pos, stock) as (values
  ('Brunch', 'Formule brunch complète', 'Boisson chaude, jus pressé, viennoiserie, œufs, pancakes', 2400, 10, 720, 1, null),
  ('Brunch', 'Pancakes sirop d''érable', 'Trois pancakes maison, fruits frais', 950, 10, 210, 2, null),
  ('Brunch', 'Avocado toast', 'Pain de campagne, avocat, œuf poché', 1100, 10, 340, 3, null),
  ('Brunch', 'Œufs brouillés & bacon', 'Pain grillé, salade', 1050, 10, 290, 4, null),
  ('Brunch', 'Bowl granola', 'Yaourt, granola maison, fruits de saison', 750, 10, 180, 5, null),
  ('Brunch', 'Viennoiserie du jour', null, 220, 10, 60, 6, null),
  ('Brunch', 'Café', null, 200, 10, 25, 7, null),
  ('Brunch', 'Cappuccino', null, 350, 10, 55, 8, null),
  ('Brunch', 'Jus d''orange pressé', null, 450, 10, 120, 9, null),
  ('Snack', 'Burger du Miam', 'Bœuf, cheddar, oignons confits, frites', 1550, 10, 460, 1, null),
  ('Snack', 'Croque-monsieur', 'Jambon, comté, salade', 900, 10, 240, 2, null),
  ('Snack', 'Wrap poulet', 'Poulet grillé, crudités, sauce yaourt', 1050, 10, 300, 3, null),
  ('Snack', 'Salade César', 'Poulet, parmesan, croûtons', 1350, 10, 390, 4, null),
  ('Snack', 'Hot-dog', null, 750, 10, 190, 5, null),
  ('Snack', 'Frites maison', null, 450, 10, 80, 6, null),
  ('Snack', 'Glace deux boules', 'Parfums du jour', 450, 10, 110, 7, null),
  ('Snack', 'Soda 33 cl', null, 300, 10, 70, 8, null),
  ('Snack', 'Bière pression 25 cl', null, 450, 20, 100, 9, null),
  ('Restaurant', 'Moules-frites', 'Marinière ou à la crème', 1800, 10, 520, 1, null),
  ('Restaurant', 'Poisson du jour', 'Selon la pêche, légumes de saison', 2200, 10, 750, 2, null),
  ('Restaurant', 'Entrecôte frites', 'Sauce au poivre', 2400, 10, 900, 3, null),
  ('Restaurant', 'Risotto aux champignons', 'Parmesan, huile de truffe', 1700, 10, 400, 4, null),
  ('Restaurant', 'Tartare de bœuf', 'Préparé ou à préparer, frites', 1900, 10, 620, 5, null),
  ('Restaurant', 'Fondant au chocolat', 'Glace vanille', 750, 10, 150, 6, null),
  ('Restaurant', 'Tarte du jour', null, 650, 10, 160, 7, null),
  ('Restaurant', 'Verre de vin', 'Blanc, rosé ou rouge', 500, 20, 140, 8, null),
  ('Épicerie', 'Baguette tradition', null, 130, 5.5, null, 1, 'Baguette tradition'),
  ('Épicerie', 'Lait demi-écrémé 1 L', null, 160, 5.5, null, 2, 'Lait demi-écrémé 1 L'),
  ('Épicerie', 'Œufs fermiers x6', null, 320, 5.5, null, 3, 'Œufs fermiers x6'),
  ('Épicerie', 'Pâtes 500 g', null, 190, 5.5, null, 4, 'Pâtes 500 g'),
  ('Épicerie', 'Café moulu 250 g', null, 490, 5.5, null, 5, 'Café moulu 250 g'),
  ('Épicerie', 'Confiture artisanale', null, 550, 5.5, null, 6, 'Confiture artisanale'),
  ('Épicerie', 'Chips 150 g', null, 250, 5.5, null, 7, 'Chips 150 g'),
  ('Épicerie', 'Eau minérale 1,5 L', null, 120, 5.5, null, 8, 'Eau minérale 1,5 L'),
  ('Épicerie', 'Glace vanille 500 ml', null, 650, 5.5, null, 9, 'Glace vanille 500 ml'),
  ('Épicerie', 'Rosé local 75 cl', null, 1200, 20, null, 10, 'Rosé local 75 cl')
)
insert into public.menu_items (category_id, name, description, price_cents, vat_rate, cost_cents, position, stock_item_id, is_demo)
select c.id, v.name, v.descr, v.price, v.vat, v.cost, v.pos,
       (select s.id from public.stock_items s where s.name = v.stock and s.is_demo limit 1), true
from v join public.menu_categories c on c.name = v.cat;

select c.name as categorie, count(*) as produits
from public.menu_items mi join public.menu_categories c on c.id = mi.category_id
where mi.is_demo group by c.name, c.position order by c.position;
