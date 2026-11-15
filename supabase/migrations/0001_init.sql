-- Le Comptoir du Miam : schéma initial
-- À exécuter dans Supabase > SQL Editor (ou via `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profils clients
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  postal_code text,
  on_camping boolean not null default false,
  mobilhome text,
  phone text,
  welcome_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Crée le profil à l'inscription, à partir des données saisies dans le formulaire
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, postal_code, on_camping, mobilhome)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'given_name'),
    coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data ->> 'family_name'),
    new.raw_user_meta_data ->> 'postal_code',
    coalesce((new.raw_user_meta_data ->> 'on_camping')::boolean, false),
    new.raw_user_meta_data ->> 'mobilhome'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Équipe : administrateur, éditeur, lecteur
-- ---------------------------------------------------------------------------
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('admin', 'editeur', 'lecteur')),
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create or replace function public.staff_role()
returns text
language sql stable security definer set search_path = public
as $$ select role from public.staff where user_id = auth.uid() $$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.staff where user_id = auth.uid()) $$;

create or replace function public.can_edit()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.staff_role() in ('admin', 'editeur'), false) $$;

-- ---------------------------------------------------------------------------
-- Réglages du restaurant (une seule ligne)
-- ---------------------------------------------------------------------------
create table public.settings (
  id int primary key default 1 check (id = 1),
  address text,
  hours text,
  phone text,
  contact_email text,
  instagram_url text,
  ubereats_url text,
  camping_name text default 'La Dune des Sables',
  opening_label text default 'Ouverture le 1er avril 2027',
  ordering_open boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1);

-- ---------------------------------------------------------------------------
-- Carte
-- ---------------------------------------------------------------------------
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  moment text,
  position int not null default 0,
  active boolean not null default true
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories (id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  available boolean not null default true,
  position int not null default 0,
  stock_item_id uuid,
  created_at timestamptz not null default now()
);

insert into public.menu_categories (name, moment, position) values
  ('Brunch', 'Le matin', 1),
  ('Snack', 'Le midi', 2),
  ('Restaurant', 'Le soir', 3),
  ('Épicerie', 'Toute la journée', 4);

-- ---------------------------------------------------------------------------
-- Stocks épicerie
-- ---------------------------------------------------------------------------
create table public.stock_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  section text not null check (section in ('sec', 'frais', 'surgele')),
  unit text not null default 'unité',
  quantity numeric not null default 0,
  alert_threshold numeric not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.menu_items
  add constraint menu_items_stock_fk foreign key (stock_item_id) references public.stock_items (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity (start with 1001),
  user_id uuid references auth.users (id) on delete set null,
  mode text not null check (mode in ('mobilhome', 'emporter', 'table')),
  location text,
  note text,
  status text not null default 'en_attente_paiement'
    check (status in ('en_attente_paiement', 'nouvelle', 'en_preparation', 'prete', 'terminee', 'annulee')),
  total_cents int not null default 0,
  sumup_checkout_id text unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_user_idx on public.orders (user_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name text not null,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0)
);
create index order_items_order_idx on public.order_items (order_id);

-- Décrémente le stock des articles d'épicerie liés quand une commande est payée
create or replace function public.apply_stock_on_paid()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.paid_at is not null and old.paid_at is null then
    update public.stock_items s
       set quantity = greatest(s.quantity - oi.quantity, 0), updated_at = now()
      from public.order_items oi
      join public.menu_items mi on mi.id = oi.menu_item_id
     where oi.order_id = new.id and mi.stock_item_id = s.id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_paid_stock
  before update on public.orders
  for each row execute function public.apply_stock_on_paid();

-- Les commandes arrivent en direct sur l'écran cuisine
alter publication supabase_realtime add table public.orders;

-- ---------------------------------------------------------------------------
-- Règles d'accès (RLS)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.settings enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.stock_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profils : chacun le sien ; l'équipe voit tout
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff_update on public.profiles for update using (public.can_edit());

-- Équipe : visible par l'équipe ; gérée par l'administrateur (via le serveur)
create policy staff_read on public.staff for select using (public.is_staff());
create policy staff_admin_write on public.staff for all using (public.staff_role() = 'admin') with check (public.staff_role() = 'admin');

-- Réglages : lecture publique, modification par les éditeurs
create policy settings_read on public.settings for select using (true);
create policy settings_write on public.settings for update using (public.can_edit());

-- Carte : lecture publique, modification par les éditeurs
create policy categories_read on public.menu_categories for select using (active or public.is_staff());
create policy categories_write on public.menu_categories for all using (public.can_edit()) with check (public.can_edit());
create policy items_read on public.menu_items for select using (true);
create policy items_write on public.menu_items for all using (public.can_edit()) with check (public.can_edit());

-- Stocks : équipe en lecture, éditeurs en écriture
create policy stock_read on public.stock_items for select using (public.is_staff());
create policy stock_write on public.stock_items for all using (public.can_edit()) with check (public.can_edit());

-- Commandes : le client voit les siennes, l'équipe voit tout, les éditeurs changent le statut.
-- La création se fait côté serveur (prix recalculés), jamais directement depuis le navigateur.
create policy orders_read on public.orders for select using (user_id = auth.uid() or public.is_staff());
create policy orders_update on public.orders for update using (public.can_edit());
create policy order_items_read on public.order_items for select using (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
