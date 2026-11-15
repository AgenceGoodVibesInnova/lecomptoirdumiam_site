# Application « Le Comptoir du Miam » (iPhone et Android)

Application Expo (SDK 58, Expo Router). Elle utilise le même Supabase et les mêmes API que le site
(`https://www.lecomptoirdumiam.fr`). Aucune clé secrète n'est dans l'application : seulement l'adresse du site,
l'adresse Supabase et la clé publique (`app.json` › `extra`).

## Clients
Connexion / inscription · commande au mobil-home, à emporter ou à table · paiement SumUp (page sécurisée du site
dans l'application) · suivi en direct · « Recommander » en un geste · carte de fidélité · notifications « commande prête ».

## Équipe (comptes présents dans Admin › Équipe)
Onglet **Équipe** : commandes en direct (en ligne et sur place), avancer le statut, prévenir le client, encaisser
(terminal SumUp ou espèces), et **prendre une commande** à table ou au comptoir.

## Tester sur un iPhone avec Expo Go
Sur un ordinateur avec Node.js 20+ :
```
cd mobile
npm install
npx expo start
```
Puis scanner le QR code avec l'appareil photo de l'iPhone (Expo Go installé depuis l'App Store).
Les notifications ne fonctionnent qu'une fois l'application publiée (compte Apple Developer requis).

## Publier
`npx eas-cli@latest build -p ios` puis `npx eas-cli@latest submit -p ios` (compte Apple Developer),
idem avec `-p android` (compte Google Play). `eas init` ajoute le `projectId` utilisé par les notifications.
