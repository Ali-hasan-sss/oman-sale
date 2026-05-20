#!/usr/bin/env bash
# Issue Let's Encrypt certificates for omansale.om + api.omansale.om
# Run on the VPS as root (or with sudo).
set -euo pipefail

DOMAIN_ROOT="omansale.om"
DOMAIN_WWW="www.omansale.om"
DOMAIN_API="api.omansale.om"
EMAIL="${CERTBOT_EMAIL:-info@omansale.om}"
REPO_DIR="${REPO_DIR:-/var/www/omansale}"

echo "==> Install certbot (if missing)"
if ! command -v certbot >/dev/null 2>&1; then
  apt update
  apt install -y certbot
fi

echo "==> Prepare webroot"
mkdir -p /var/www/certbot

echo "==> Deploy HTTP-only nginx configs (required before first certificate)"
cp "${REPO_DIR}/infra/nginx/omansale.om.http.conf" /etc/nginx/sites-available/omansale.om
cp "${REPO_DIR}/infra/nginx/api.omansale.om.http.conf" /etc/nginx/sites-available/api.omansale.om
ln -sf /etc/nginx/sites-available/omansale.om /etc/nginx/sites-enabled/omansale.om
ln -sf /etc/nginx/sites-available/api.omansale.om /etc/nginx/sites-enabled/api.omansale.om
nginx -t
systemctl reload nginx

echo "==> Request certificate (single cert for all hostnames)"
certbot certonly --webroot \
  -w /var/www/certbot \
  -d "${DOMAIN_ROOT}" \
  -d "${DOMAIN_WWW}" \
  -d "${DOMAIN_API}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

echo "==> Deploy HTTPS nginx configs"
cp "${REPO_DIR}/infra/nginx/omansale.om" /etc/nginx/sites-available/omansale.om
cp "${REPO_DIR}/infra/nginx/api.omansale.om" /etc/nginx/sites-available/api.omansale.om
nginx -t
systemctl reload nginx

echo "==> Enable auto-renewal dry-run"
certbot renew --dry-run

echo "Done. Certificates live at /etc/letsencrypt/live/${DOMAIN_ROOT}/"
