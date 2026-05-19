# نشر Oman Sale على VPS بدون دومين

هذا الدليل يفترض أن السيرفر عليه مشاريع أخرى، لذلك سنشغل Oman Sale على بورت عام مستقل عبر Nginx.

## البورتات المقترحة

- الباكند API داخليًا فقط: `127.0.0.1:3600`
- الواجهة Next.js داخليًا فقط: `127.0.0.1:3601`
- Nginx خارجيًا للمستخدمين: `http://72.62.197.60:3601`

مهم: لأن Next.js وNginx يستخدمان نفس رقم البورت `3601`، يجب أن يعمل Next على `127.0.0.1:3601` فقط، ويعمل Nginx على IP السيرفر العام `72.62.197.60:3601`. لا تجعل Next يستمع على `0.0.0.0:3601`.

## لماذا هذا مهم للـ rate limit والمشاهدات؟

الـ API مضبوط على `TRUST_PROXY=1`، وNginx يرسل:

- `X-Real-IP`
- `X-Forwarded-For`
- `X-Forwarded-Proto`

بهذا يقرأ Express عنوان IP الحقيقي للزائر من `req.ip` بدل أن يرى كل الطلبات كأنها من `127.0.0.1` أو IP الخاص بـ Nginx. هذا يؤثر مباشرة على:

- `apiRateLimiter`
- تسجيل مشاهدات الإعلانات

مهم: اجعل API يعمل على `HOST=127.0.0.1` ولا تفتح بورت `3600` للعامة، حتى لا يستطيع أحد إرسال `X-Forwarded-For` مزيف مباشرة إلى الباكند.

## ملفات البيئة

انسخ الأمثلة:

```bash
cp .env.production.example .env
cp apps/web/.env.production.example apps/web/.env.production
```

عدّل `.env`:

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=3600
TRUST_PROXY=1
API_URL=http://72.62.197.60:3601
WEB_URL=http://72.62.197.60:3601
CORS_ORIGINS=http://72.62.197.60:3601
```

عدّل `apps/web/.env.production`:

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_API_PORT=3600
```

استخدام `/api/v1` يجعل الواجهة تتصل بنفس IP ونفس بورت Nginx، لذلك لا تحتاج دومين ولا CORS بين بورتات مختلفة.

## قاعدة البيانات و Redis

ثبّت PostgreSQL و Redis على السيرفر، ثم أنشئ قاعدة البيانات والمستخدم بما يناسب قيمة `DATABASE_URL`.

مثال سريع:

```bash
sudo apt update
sudo apt install -y postgresql redis-server nginx
sudo systemctl enable --now postgresql redis-server nginx
```

## البناء

من مجلد المشروع:

```bash
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build
```

إذا غيرت `NEXT_PUBLIC_API_URL` أو بورت Nginx لاحقًا، أعد بناء الواجهة لأن متغيرات `NEXT_PUBLIC_*` تدخل داخل build.

## Prisma على السيرفر (مهم)

- على الإنتاج استخدم **`npm run prisma:deploy`** (يطبّق المايجريشن الموجودة في المستودع دون إنشاء مايجريشن جديدة).
- **`npm run prisma:migrate`** يشغّل `migrate dev` وهو مخصص التطوير المحلي ويحتاج قاعدة **shadow** (`SHADOW_DATABASE_URL` / `oman_sale_shadow`). إذا لم تنشئها سيظهر خطأ `P1003`.
- إن أردت استخدام `migrate dev` على السيرفر (غير مُستحسن): أنشئ قاعدة `oman_sale_shadow` وضع `SHADOW_DATABASE_URL` في `.env` كما في `.env.example`.

## تشغيل الخدمات بـ PM2

```bash
sudo npm install -g pm2

pm2 start ecosystem.config.cjs

pm2 save
pm2 startup
```

## إعداد Nginx

يوجد ملفان:

```bash
infra/nginx/omansale.om
infra/nginx/api.omansale.om
```

`omansale.om` خاص بالواجهة، ويحتوي أيضًا على توجيه `/api/` و`/socket.io/` إلى الباكند حتى يعمل المشروع بدون دومين عبر IP واحد.

`api.omansale.om` خاص بالباكند ومجهز للدومين لاحقًا. يمكن تفعيله الآن بدون ضرر، لكنه لن يستخدم من المتصفح إلا عند وجود DNS أو عند إرسال `Host: api.omansale.om`.

انسخهما إلى Nginx:

```bash
sudo cp infra/nginx/omansale.om /etc/nginx/sites-available/omansale.om
sudo cp infra/nginx/api.omansale.om /etc/nginx/sites-available/api.omansale.om
sudo ln -s /etc/nginx/sites-available/omansale.om /etc/nginx/sites-enabled/omansale.om
sudo ln -s /etc/nginx/sites-available/api.omansale.om /etc/nginx/sites-enabled/api.omansale.om
sudo nginx -t
sudo systemctl reload nginx
```

افتح البورت في الجدار الناري:

```bash
sudo ufw allow 3601/tcp
```

ثم افتح:

```text
http://72.62.197.60:3601
```

## فحص سريع

```bash
curl http://72.62.197.60:3601/api/v1/health
```

يجب أن يرجع:

```json
{"status":"ok","service":"oman-sale-api"}
```

## ملاحظات عند إضافة دومين لاحقًا

عند توفر دومين:

- `omansale.om` سيخدم الواجهة.
- `api.omansale.om` سيخدم الباكند.
- غيّر `WEB_URL` و`API_URL` و`CORS_ORIGINS`.
- أبقِ `NEXT_PUBLIC_API_URL=/api/v1` إذا ستستمر بتوجيه `/api/` من ملف الواجهة إلى الباكند.
- أعد build للواجهة.
