-- Application mobile : notifications, fidélité, paiement par lien.

-- Jetons de notification (Expo) des téléphones des clients. Lus et écrits uniquement côté serveur.
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text,
  created_at timestamptz not null default now()
);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;

-- Lien de paiement propre à chaque commande (sert à payer depuis l'application, sans session web).
alter table public.orders
  add column if not exists pay_token uuid not null default gen_random_uuid(),
  add column if not exists reward_used boolean not null default false;
create unique index if not exists orders_pay_token_idx on public.orders (pay_token);

-- Carte de fidélité
alter table public.settings
  add column if not exists loyalty_enabled boolean not null default true,
  add column if not exists loyalty_goal int not null default 10 check (loyalty_goal between 2 and 50),
  add column if not exists loyalty_reward_cents int not null default 500 check (loyalty_reward_cents >= 0),
  add column if not exists loyalty_reward_label text not null default '5 € offerts sur votre commande';
