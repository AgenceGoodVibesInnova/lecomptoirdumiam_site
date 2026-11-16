# Tests de bout en bout

Une copie locale complète (base, API, connexion, e-mails, site, aperçu de l'application) permet de tester
tous les parcours sans toucher aux données réelles.

```
bash tests/local/demarrer.sh          # monte la copie locale (Linux, PostgreSQL 16, Node, Python + Playwright)
python3 tests/e2e/crawl.py            # pages publiques, liens cassés, débordements mobile
python3 tests/e2e/flow_client.py      # inscription, confirmation, bienvenue, espace client, mot de passe oublié
python3 tests/e2e/flow_admin.py       # commande équipe, paiement simulé, cuisine, factures, carte, stocks, clients, équipe, réglages
python3 tests/e2e/flow_extra.py       # fidélité, commande ouverte sans SumUp, barre panier mobile
python3 tests/e2e/flow_app.py         # application (client et équipe)
```

Chaque scénario se termine par `RESUME: []` quand tout passe. Les e-mails envoyés sont visibles sur http://localhost:1080.
Tout ce qui est généré (base, clés de test, captures) reste dans `tests/.local/`, ignoré par Git.
