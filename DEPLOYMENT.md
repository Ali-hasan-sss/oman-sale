# نشر Oman Sale على VPS

## الدومين و SSL (الإنتاج)

| الخدمة | الدومين |
|--------|---------|
| الواجهة | `https://omansale.om` |
| الباكند | `https://api.omansale.om` |

### 1) DNS

أضف سجلات **A** عند مزود الدومين (كلها تشير إلى IP السيرفر، مثل `72.62.197.60`):

```text
omansale.om       → 72.62.197.60
www.omansale.om   → 72.62.197.60
api.omansale.om   → 72.62.197.60
```

تحقق قبل المتابعة:

```bash
dig +short omansale.om
dig +short api.omansale.om
```

### 2) البورتات الداخلية

- API (داخلي): `127.0.0.1:3600`
- Next.js (داخلي): `127.0.0.1:3601`
- Nginx (عام): `80` و `443`

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 3) ملفات البيئة

```bash
cp .env.production.example .env
cp apps/web/.env.production.example apps/web/.env.production
```

عدّل `.env` (أهم القيم):

```env
WEB_URL=https://omansale.om
API_URL=https://api.omansale.om
CORS_ORIGINS=https://omansale.om,https://www.omansale.om,https://api.omansale.om
HOST=127.0.0.1
PORT=3600
TRUST_PROXY=1
```

`apps/web/.env.production`:

```env
NEXT_PUBLIC_API_URL=/api/v1
```

> الواجهة تتصل بالـ API عبر نفس الدومين (`/api/`) فلا تحتاج CORS منفصل للمتصفح.

**تطبيق الموبايل** — في `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://api.omansale.om/api/v1
```

### 4) البناء والتشغيل

```bash
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build
pm2 start ecosystem.config.cjs
pm2 save
```

### 5) Nginx + شهادة SSL (Let's Encrypt)

ملفات جاهزة في `infra/nginx/`:

| ملف | الغرض |
|-----|--------|
| `omansale.om.http.conf` | HTTP مؤقت قبل الشهادة |
| `api.omansale.om.http.conf` | HTTP مؤقت قبل الشهادة |
| `omansale.om` | HTTPS نهائي للواجهة |
| `api.omansale.om` | HTTPS نهائي للـ API |

**طريقة آلية (مُفضّلة):**

```bash
cd /var/www/omansale   # مسار المشروع على السيرفر
chmod +x infra/scripts/setup-ssl.sh
sudo CERTBOT_EMAIL=info@omansale.om REPO_DIR=/var/www/omansale infra/scripts/setup-ssl.sh
```

**طريقة يدوية:**

```bash
sudo mkdir -p /var/www/certbot
sudo cp infra/nginx/omansale.om.http.conf /etc/nginx/sites-available/omansale.om
sudo cp infra/nginx/api.omansale.om.http.conf /etc/nginx/sites-available/api.omansale.om
sudo ln -sf /etc/nginx/sites-available/omansale.om /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.omansale.om /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot
sudo certbot certonly --webroot -w /var/www/certbot \
  -d omansale.om -d www.omansale.om -d api.omansale.om \
  --email info@omansale.om --agree-tos --no-eff-email

sudo cp infra/nginx/omansale.om /etc/nginx/sites-available/omansale.om
sudo cp infra/nginx/api.omansale.om /etc/nginx/sites-available/api.omansale.om
sudo nginx -t && sudo systemctl reload nginx
sudo certbot renew --dry-run
```

### 6) فحص

```bash
curl -I https://omansale.om
curl https://omansale.om/api/v1/health
curl https://api.omansale.om/api/v1/health
```

المتوقع:

```json
{"status":"ok","service":"oman-sale-api"}
```

---

## الوصول القديم عبر IP:3601 (اختياري)

إذا كنت ما زلت تستخدم `http://IP:3601` راجع `infra/nginx/omansale-vps.conf.example`.
بعد تفعيل الدومين يُفضّل إيقاف البورت `3601` العام والاعتماد على `443` فقط.

---

## Prisma على السيرفر

- استخدم **`npm run prisma:deploy`** على الإنتاج (لا `prisma migrate dev`).
- `migrate dev` يحتاج قاعدة shadow ولا يُستخدم على السيرفر.

---

## PM2

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## CORS — ملخص

| المصدر | الإعداد |
|--------|---------|
| متصفح على `omansale.om` | same-origin `/api/v1` — لا يحتاج CORS إضافي |
| طلبات مباشرة للـ API | `WEB_URL` + `CORS_ORIGINS` في `.env` |
| تطبيق الموبايل | `https://api.omansale.om/api/v1` — لا يخضع لـ CORS المتصفح |

---

## تحديث بعد تغيير `NEXT_PUBLIC_*`

```bash
npm run build
pm2 restart oman-sale-web
sudo nginx -t && sudo systemctl reload nginx
```
