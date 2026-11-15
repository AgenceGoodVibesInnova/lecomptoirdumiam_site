# Le Comptoir du Miam

Site et application de gestion du restaurant Le Comptoir du Miam (camping La Dune des Sables) :
commande en ligne, paiement SumUp, espace client, et espace de gestion (écran cuisine, carte et menus,
stocks épicerie, statistiques, clients, équipe).

- **Code** : ce dépôt GitHub
- **Application** : Next.js, hébergée sur Vercel
- **Base de données et comptes** : Supabase (e-mail + mot de passe, Google, Facebook)
- **Paiement** : SumUp (API de paiement en ligne)
- **E-mails** (inscription, mot de passe, commande, facture, invitation) : SMTP IONOS, gabarit commun `lib/emails/layout.ts`
- **Nom de domaine** : IONOS (lecomptoirdumiam.fr), relié à Vercel

## Pages

| Adresse | Rôle |
|---|---|
| `/` | Accueil |
| `/carte` | Carte, tirée de la base |
| `/commander` | Choix : Uber Eats, mobil-home, à emporter, à table |
| `/commander/[mode]` | Panier (connexion obligatoire) |
| `/paiement/[id]` | Paiement SumUp |
| `/commande/[id]` | Confirmation et suivi |
| `/facture/[id]` | Facture imprimable (client propriétaire ou équipe) |
| `/connexion` | Inscription / connexion client |
| `/compte` | Espace client : historique, infos, « Passer une commande » |
| `/admin/connexion` | Connexion de l'équipe (lien « Accès administrateur » en pied de page) |
| `/admin` | Statistiques |
| `/admin/cuisine` | Écran cuisine en direct |
| `/admin/commandes` | Toutes les commandes ; fiche commande, statut, envoi de facture |
| `/admin/carte` | Plats, prix, disponibilités |
| `/admin/stocks` | Stocks sec / frais / surgelé, alertes |
| `/admin/clients` | Fichier clients |
| `/admin/equipe` | Invitations, niveaux lecteur / éditeur |
| `/admin/reglages` | Adresse, horaires, liens, ouverture de la commande en ligne |

## Niveaux d'accès

- **Administrateur** : tout, plus inviter et retirer des personnes.
- **Éditeur** : gère commandes, carte, stocks et réglages.
- **Lecteur** : voit tout, ne modifie rien.

Les règles sont appliquées dans la base (RLS, `supabase/migrations/0001_init.sql`), pas seulement dans l'interface.

## Mise en ligne, étape par étape

### 1. Supabase
1. Créer un projet sur supabase.com (région Europe).
2. SQL Editor : exécuter `supabase/migrations/0001_init.sql`, puis `0002_couts_factures.sql`.
3. Authentication > URL Configuration : *Site URL* = `https://lecomptoirdumiam.fr`, et ajouter
   `https://lecomptoirdumiam.fr/**` (et l'adresse Vercel) aux *Redirect URLs*.
4. Authentication > Providers : activer Google et Facebook (identifiants à créer chez Google Cloud et Meta for Developers).
5. Authentication > Email Templates > *Invite user* : remplacer le lien par
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/mot-de-passe`
   et *Reset password* par
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/mot-de-passe`.
6. Récupérer l'URL du projet, la clé `anon` et la clé `service_role` (Project Settings > API).

### 2. SumUp
1. Sur developer.sumup.com, créer une clé API pour le compte marchand et noter le code marchand.
2. Vérifier que le paiement en ligne (« Online Payments ») est activé sur le compte.

### 3. Envoi des e-mails (IONOS)
1. Dans IONOS, créer la boîte `bonjour@lecomptoirdumiam.fr` (ou une autre adresse du domaine).
2. Dans Vercel, renseigner `SMTP_HOST=smtp.ionos.fr`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS` (mot de passe de la boîte) et `EMAIL_FROM`.

### 3 bis. SMS « commande prête » depuis votre téléphone (facultatif, gratuit)
1. Sur un téléphone Android avec votre carte SIM, installer **SMS Gateway for Android** (https://docs.sms-gate.app/installation/).
2. Dans l'application : activer **Cloud Server**, appuyer sur **Start Service**, valider l'inscription (onglet Sign Up).
3. Recopier dans Vercel le **username** affiché dans `SMSGATE_USER` et le **password** dans `SMSGATE_PASS` (Secret).
4. Laisser le téléphone allumé, connecté et en charge au restaurant ; désactiver l'optimisation de batterie pour l'application.

### 4. Vercel
1. Importer ce dépôt GitHub.
2. Renseigner les variables de `.env.example`.
3. Déployer.

### 5. Domaine IONOS
Dans Vercel > Settings > Domains, ajouter `lecomptoirdumiam.fr` et `www.lecomptoirdumiam.fr`,
puis recopier dans IONOS (Domaines > DNS) les enregistrements indiqués par Vercel.

### 6. Premier administrateur
1. Sur le site, créer un compte avec `contact@lecomptoirdumiam.fr` (page `/connexion`) et confirmer l'e-mail.
2. Dans Supabase > SQL Editor, exécuter `supabase/premier-administrateur.sql`.
3. Se connecter sur `/admin/connexion`. Les autres membres de l'équipe s'invitent ensuite depuis `/admin/equipe`.

### 7. Ouvrir les commandes
Dans `/admin/carte`, saisir les plats et prix ; dans `/admin/reglages`, compléter les infos
et cocher « Commande en ligne ouverte ».

## Développement local

```bash
cp .env.example .env.local   # puis remplir
npm install
npm run dev
```
