#!/usr/bin/env bash
# Adds "card image" to hero slides (dashboard upload + DB column) and updates the home ring.
# Usage: bash deploy-card-images.sh
set -euo pipefail
SERVER="${SERVER:-root@72.62.197.60}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/oman-sale}"
HERE="$(cd "$(dirname "$0")" && pwd)"
STAMP=$(date +%Y%m%d-%H%M%S)
TMP="/tmp/card-image-$STAMP"

echo "==> Uploading files (you may be asked for the server password)"
ssh "$SERVER" "mkdir -p $TMP"
scp -q "$HERE/card-image/card-image.patch" "$HERE/card-image/migration.sql" \
  "$HERE/apps/web/src/components/home/hero-section.tsx" \
  "$HERE/apps/web/src/components/home/vertex-showcase.tsx" \
  "$HERE/apps/web/src/components/home/oman-map.tsx" \
  "$HERE/apps/web/src/app/vertex.css" "$SERVER:$TMP/"

echo "==> Applying changes, migrating the database, building and restarting"
ssh -t "$SERVER" "bash -lic '
set -e
cd $REMOTE_DIR
tar czf backup-before-card-images-$STAMP.tgz apps/api/prisma/schema.prisma apps/api/src/modules/hero apps/web/src/components/admin/admin-hero-management.tsx apps/web/src/components/home apps/web/src/app/vertex.css
echo \"    backup: $REMOTE_DIR/backup-before-card-images-$STAMP.tgz\"
if command -v patch >/dev/null; then
  patch -p1 --dry-run < $TMP/card-image.patch >/dev/null || { echo \"!! Server files differ from the expected version; nothing was changed.\"; exit 1; }
  patch -p1 < $TMP/card-image.patch
else
  git apply --check $TMP/card-image.patch || { echo \"!! Server files differ from the expected version; nothing was changed.\"; exit 1; }
  git apply $TMP/card-image.patch
fi
mkdir -p apps/api/prisma/migrations/20261028120000_hero_slide_card_image
cp $TMP/migration.sql apps/api/prisma/migrations/20261028120000_hero_slide_card_image/migration.sql
cp $TMP/hero-section.tsx $TMP/vertex-showcase.tsx $TMP/oman-map.tsx apps/web/src/components/home/
cp $TMP/vertex.css apps/web/src/app/vertex.css
npm run prisma:deploy
npm run build --workspace @oman-sale/api
npm run build --workspace @oman-sale/web
pm2 restart oman-sale-api oman-sale-web
pm2 restart oman-sale-worker 2>/dev/null || true
echo \"==> Done. Dashboard: Admin > Hero slides > edit a slide > card image\"
'"
