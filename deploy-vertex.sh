#!/usr/bin/env bash
# Uploads the Vertex home-page design to the live server and rebuilds the web app.
# Usage:  bash deploy-vertex.sh            (defaults below, from DEPLOYMENT.md)
#         SERVER=user@host REMOTE_DIR=/path bash deploy-vertex.sh
set -euo pipefail
SERVER="${SERVER:-root@72.62.197.60}"
cd "$(dirname "$0")/apps/web/src"

# Find the project on the server: use REMOTE_DIR if given, otherwise ask pm2 where
# oman-sale-web runs (its cwd is <project>/apps/web), otherwise search the disk.
if [ -z "${REMOTE_DIR:-}" ]; then
  echo "==> Locating the project on the server"
  REMOTE_DIR=$(ssh "$SERVER" 'd=$(pm2 jlist 2>/dev/null | grep -o "\"pm_cwd\":\"[^\"]*apps/web\"" | head -1 | sed "s/.*:\"//; s#/apps/web\"##"); [ -n "$d" ] || d=$(find / -path /proc -prune -o -type f -path "*/apps/web/src/components/home/hero-section.tsx" -not -path "*/node_modules/*" -print 2>/dev/null | head -1 | sed "s#/apps/web/src/components/home/hero-section.tsx##"); echo "$d"')
fi
if [ -z "$REMOTE_DIR" ] || ! ssh "$SERVER" "test -d '$REMOTE_DIR/apps/web/src'"; then
  echo "!! Could not find the project on the server. Run again with REMOTE_DIR=/path/to/project"
  exit 1
fi
echo "==> Project on server: $REMOTE_DIR"

FILES=(
  app/vertex.css
  app/layout.tsx
  app/page.tsx
  components/home/hero-section.tsx
  components/home/vertex-showcase.tsx
  components/home/categories-section.tsx
  components/navigation/user-site-header.tsx
  components/navigation/user-site-header-nav.tsx
  components/navigation/header-custom-nav-buttons.tsx
  components/navigation/browse-stores-nav-button.tsx
  components/navigation/mobile-nav-menu.tsx
  components/notifications/notification-bell.tsx
)

STAMP=$(date +%Y%m%d-%H%M%S)
echo "==> Backing up current server files to $REMOTE_DIR/backup-before-vertex-$STAMP.tgz"
ssh "$SERVER" "cd $REMOTE_DIR/apps/web/src && tar czf $REMOTE_DIR/backup-before-vertex-$STAMP.tgz --ignore-failed-read ${FILES[*]} 2>/dev/null || true"

echo "==> Uploading ${#FILES[@]} files"
rsync -avR "${FILES[@]}" "$SERVER:$REMOTE_DIR/apps/web/src/"

echo "==> Building and restarting the web app"
# login + interactive shell so nvm/npm/pm2 are on PATH
ssh -t "$SERVER" "bash -lic 'cd $REMOTE_DIR && npm run build --workspace @oman-sale/web && pm2 restart oman-sale-web'"

echo "==> Done. Open https://omansale.om"
echo "    To undo: ssh $SERVER \"cd $REMOTE_DIR/apps/web/src && tar xzf $REMOTE_DIR/backup-before-vertex-$STAMP.tgz && cd $REMOTE_DIR && npm run build --workspace @oman-sale/web && pm2 restart oman-sale-web\""
