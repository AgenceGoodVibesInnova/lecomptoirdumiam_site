-- Prévenir le client par SMS quand sa commande est prête.
alter table public.orders
  add column if not exists customer_phone text,
  add column if not exists sms_ready_sent_at timestamptz;

-- Le téléphone saisi à l'inscription est enregistré dans le profil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, postal_code, on_camping, mobilhome, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'given_name'),
    coalesce(new.raw_user_meta_data ->> 'last_name', new.raw_user_meta_data ->> 'family_name'),
    new.raw_user_meta_data ->> 'postal_code',
    coalesce((new.raw_user_meta_data ->> 'on_camping')::boolean, false),
    new.raw_user_meta_data ->> 'mobilhome',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
