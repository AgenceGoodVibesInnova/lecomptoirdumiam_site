#!/usr/bin/env bash
# Copie locale complète du Comptoir du Miam pour les tests (aucune donnée réelle, aucun secret de production).
# PostgreSQL 16 + PostgREST + Supabase Auth + passerelle « façon Supabase » + capteur d'e-mails (MailDev) + site + aperçu de l'application.
# Usage (Linux, depuis la racine du dépôt) : bash tests/local/demarrer.sh   puis   python3 tests/e2e/flow_client.py   etc.
set -euo pipefail
ROOT=$(pwd); L=$ROOT/tests/.local; mkdir -p $L/shots; cd $L
PG=/usr/lib/postgresql/16/bin
[ -f postgrest ] || { curl -sL https://github.com/PostgREST/postgrest/releases/download/v13.0.8/postgrest-v13.0.8-linux-static-x86-64.tar.xz | tar xJ; }
[ -f auth ] || { curl -sL https://github.com/supabase/auth/releases/download/v2.197.0/auth-v2.197.0-x86.tar.gz | tar xz; }
[ -d node_modules/maildev ] || npm i --no-audit --no-fund --prefix $L maildev@2 >/dev/null
if [ ! -d pgdata ]; then
  mkdir pgdata && touch pg.log && chown postgres pgdata pg.log
  su postgres -c "$PG/initdb -D $L/pgdata -U postgres --auth=trust -E UTF8 --locale=C.UTF-8" >/dev/null
  echo "wal_level = logical" >> pgdata/postgresql.conf
  FRESH=1
fi
su postgres -c "$PG/pg_ctl -D $L/pgdata -o '-p 54322 -k /tmp' -l $L/pg.log start" >/dev/null || true; sleep 2
P="psql -q -h 127.0.0.1 -p 54322 -U postgres"
[ -f jwt_secret ] || python3 -c "import secrets;print(secrets.token_hex(32))" > jwt_secret
python3 - <<'PY'
import hmac,hashlib,base64,json,time
s=open('jwt_secret').read().strip().encode(); b=lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
def tok(r):
    h=b(json.dumps({"alg":"HS256","typ":"JWT"}).encode()); p=b(json.dumps({"role":r,"iss":"supabase","iat":int(time.time()),"exp":int(time.time())+10*365*86400}).encode())
    return f"{h}.{p}.{b(hmac.new(s,f'{h}.{p}'.encode(),hashlib.sha256).digest())}"
open('anon_key','w').write(tok('anon')); open('service_key','w').write(tok('service_role'))
PY
cat > gotrue.env <<EOF
GOTRUE_DB_DRIVER=postgres
DATABASE_URL="postgres://supabase_auth_admin:local-test@127.0.0.1:54322/postgres?search_path=auth&sslmode=disable"
GOTRUE_DB_NAMESPACE=auth
GOTRUE_DB_MIGRATIONS_PATH=$L/migrations
GOTRUE_API_HOST=127.0.0.1
PORT=9999
API_EXTERNAL_URL=http://localhost:54321/auth/v1
GOTRUE_SITE_URL=http://localhost:3000
GOTRUE_URI_ALLOW_LIST=http://localhost:3000/**
GOTRUE_JWT_SECRET=$(cat jwt_secret)
GOTRUE_JWT_EXP=3600
GOTRUE_JWT_AUD=authenticated
GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated
GOTRUE_JWT_ADMIN_ROLES=service_role
GOTRUE_EXTERNAL_EMAIL_ENABLED=true
GOTRUE_MAILER_AUTOCONFIRM=false
GOTRUE_SMTP_HOST=127.0.0.1
GOTRUE_SMTP_PORT=2500
GOTRUE_SMTP_ADMIN_EMAIL=test@local.test
GOTRUE_LOG_LEVEL=warn
EOF
if [ "${FRESH:-0}" = 1 ]; then
  $P -f $ROOT/tests/local/bootstrap.sql
  (set -a; . ./gotrue.env; set +a; ./auth migrate >/dev/null 2>&1)
  for f in $ROOT/supabase/migrations/*.sql $ROOT/supabase/produits-demo.sql; do $P -v ON_ERROR_STOP=1 -f $f >/dev/null; done
fi
printf 'db-uri = "postgres://authenticator:local-test@127.0.0.1:54322/postgres"\ndb-schemas = "public"\ndb-anon-role = "anon"\njwt-secret = "%s"\nserver-host = "127.0.0.1"\nserver-port = 3001\n' "$(cat jwt_secret)" > pgrst.conf
(set -a; . ./gotrue.env; set +a; nohup ./auth serve > auth.log 2>&1 &)
nohup ./postgrest pgrst.conf > pgrst.log 2>&1 &
nohup node $ROOT/tests/local/gateway.js > gateway.log 2>&1 &
nohup npx --prefix $L maildev --smtp 2500 --web 1080 --ip 127.0.0.1 --incoming-user test --incoming-pass test > maildev.log 2>&1 &
cat > site.env <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(cat anon_key)
SUPABASE_SERVICE_ROLE_KEY=$(cat service_key)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SMTP_HOST=127.0.0.1
SMTP_PORT=2500
SMTP_USER=test
SMTP_PASS=test
NEXT_TELEMETRY_DISABLED=1
EOF
sleep 4
# Administrateur de test (mot de passe aléatoire, gardé dans tests/.local/admin_pw)
if [ ! -f admin_pw ]; then
  python3 - <<'PY'
import json,secrets,urllib.request,subprocess
svc=open('service_key').read().strip(); pw="Test-"+secrets.token_hex(6); open('admin_pw','w').write(pw)
r=urllib.request.Request("http://127.0.0.1:54321/auth/v1/admin/users",data=json.dumps({"email":"admin@test.local","password":pw,"email_confirm":True,"user_metadata":{"first_name":"Alex","last_name":"Admin"}}).encode(),headers={"apikey":svc,"authorization":"Bearer "+svc,"content-type":"application/json"},method="POST")
uid=json.load(urllib.request.urlopen(r))["id"]
subprocess.run(["psql","-q","-h","127.0.0.1","-p","54322","-U","postgres","-c",f"insert into staff(user_id,email,role) values ('{uid}','admin@test.local','admin')"],check=True)
PY
fi
cd $ROOT && set -a && . $L/site.env && set +a && npx next build >/dev/null && (nohup npx next start -p 3000 > $L/next.log 2>&1 &)
(cd mobile && EXPO_PUBLIC_SITE_URL=http://localhost:3000 EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321 EXPO_PUBLIC_SUPABASE_KEY=$(cat $L/anon_key) EXPO_OFFLINE=1 npx expo export --platform web --output-dir $L/appdist >/dev/null)
nohup node tests/local/appserve.js > $L/appserve.log 2>&1 &
echo "Prêt : site http://localhost:3000 · application http://localhost:8081/app · e-mails http://localhost:1080"
