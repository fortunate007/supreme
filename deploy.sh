#!/usr/bin/env bash
# Deploys the working tree to hosting.com the way the git deployer does:
# new folder in ~/deploys, install, flip the 'current' link, restart, health check, automatic rollback.
cd "$(dirname "$0")" || exit 1
CFG=.deploy.env
if [ ! -f "$CFG" ]; then
  read -rp "SSH command [ssh -p 22 supremea1@198.38.92.52]: " SSHCMD
  SSHCMD=${SSHCMD:-ssh -p 22 supremea1@198.38.92.52}
  read -rp "Live site address [https://supremeaccessories.com]: " SITE; SITE=${SITE:-https://supremeaccessories.com}
  printf 'SSHCMD=%q\nSITE=%q\n' "$SSHCMD" "$SITE" > "$CFG"
fi
. "./$CFG"
TARGET=$(printf '%s' "$SSHCMD" | grep -oE '[^ ]+@[^ ]+' | head -1)
[ -n "$TARGET" ] || { echo "Could not find user@host in: $SSHCMD (delete $CFG and run again)"; exit 1; }
mkdir -p ~/.ssh
SSHBASE="${SSHCMD/$TARGET/} -o ControlMaster=auto -o ControlPath=$HOME/.ssh/supreme-%C -o ControlPersist=300"
command -v rsync >/dev/null || { echo "Install rsync first: sudo apt install rsync"; exit 1; }

echo "Branch: $(git branch --show-current) | uncommitted changes: $(git status --short | wc -l)"
node --check server.js || { echo "server.js has a syntax error, stopping."; exit 1; }
for f in server.js package.json package-lock.json public/index.html; do
  [ -f "$f" ] || { echo "Missing $f, stopping."; exit 1; }
done

echo "--- checking the server (your password is asked once)"
PREV=$($SSHBASE "$TARGET" 'readlink ~/deploys/current' 2>/dev/null)
[ -n "$PREV" ] || { echo "~/deploys/current is not a link here, so I will not guess. Run: ssh ... 'ls -la ~/deploys' and paste it to me."; exit 1; }
PN=${PREV##*/}
echo "currently live: $PREV"
read -rp "Deploy this working tree? [y/N] " ok
[ "$ok" = y ] || { echo "Cancelled."; exit 0; }

NEW="manual-$(date +%Y%m%d-%H%M%S)"
ITEMS="server.js package.json package-lock.json public"
[ -d private ] && ITEMS="$ITEMS private"
[ -f .node-version ] && ITEMS="$ITEMS .node-version"

echo "--- uploading to ~/deploys/$NEW"
$SSHBASE "$TARGET" "mkdir -p ~/deploys/$NEW" || exit 1
rsync -azR --exclude '*.bak.*' -e "$SSHBASE" $ITEMS "$TARGET:deploys/$NEW/" || exit 1
$SSHBASE "$TARGET" "echo $NEW > ~/deploys/$NEW/public/deploy-id.txt"
$SSHBASE "$TARGET" 'P=$(readlink ~/deploys/current); case "$P" in /*) ;; *) P=~/deploys/$P;; esac; [ -f "$P/.env" ] && cp "$P/.env" ~/deploys/'"$NEW"'/.env && echo ".env copied from the current deploy" || echo "no .env in the current deploy (the panel probably supplies the settings)"'

echo "--- installing dependencies on the server"
$SSHBASE "$TARGET" "cd ~/deploys/$NEW && node -v && npm ci --omit=dev --no-audit --no-fund 2>&1 | tail -4 && test -f node_modules/iconv-lite/encodings/index.js && echo 'dependencies complete'" \
  || { echo "Install failed. Nothing was switched: the live site is untouched."; exit 1; }

echo "--- switching and restarting"
$SSHBASE "$TARGET" "ln -sfn ~/deploys/$NEW ~/deploys/current; pkill -u \$(id -un) -f '[n]ode server.js'; echo switched"

healthy=0
echo "--- waiting for the app (up to 2 minutes)"
for i in $(seq 1 24); do
  sleep 5
  ID=$(curl -s "$SITE/deploy-id.txt" | tr -d '[:space:]')
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$SITE/api/products")
  if [ "$ID" = "$NEW" ] && [ "$CODE" = 200 ]; then healthy=1; break; fi
  printf '.'
done; echo

if [ "$healthy" = 1 ]; then
  echo "LIVE: $NEW"
  curl -s "$SITE/js/layout.js" | head -1
  curl -s -X POST "$SITE/api/inquiries" -H 'Content-Type: application/json' -d '{}'; echo
  $SSHBASE "$TARGET" "ls -dt ~/deploys/manual-* 2>/dev/null | tail -n +4 | grep -v '/$PN\$' | xargs -r rm -rf; true"
  echo "To roll back later: $SSHBASE $TARGET 'ln -sfn $PREV ~/deploys/current; pkill -u \$(id -un) -f \"[n]ode server.js\"'"
else
  echo "The new version did not come up healthy. Rolling back to $PN ..."
  $SSHBASE "$TARGET" "ln -sfn $PREV ~/deploys/current; pkill -u \$(id -un) -f '[n]ode server.js'; sleep 2; ls ~/persistent_app_*.log >/dev/null 2>&1 && tail -n 15 ~/persistent_app_*.log"
  echo "Rolled back. The log lines above show why it failed. Paste them to me."
fi
