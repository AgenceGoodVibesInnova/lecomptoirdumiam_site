-- À exécuter UNE FOIS, après avoir créé votre compte sur le site
-- (page /connexion, avec l'adresse contact@lecomptoirdumiam.fr).
-- Ce script vous donne le rôle d'administrateur.
-- Aucun mot de passe n'est stocké ici : vous le choisissez vous-même à l'inscription.

insert into public.staff (user_id, email, role)
select id, email, 'admin'
from auth.users
where email = 'contact@lecomptoirdumiam.fr'
on conflict (user_id) do update set role = 'admin';
