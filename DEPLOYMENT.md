# نشر Oman Sale على VPS بدون دومين

هذا الدليل يفترض أن السيرفر عليه مشاريع أخرى، لذلك سنشغل Oman Sale على بورت عام مستقل عبر Nginx.

## البورتات المقترحة

- الواجهة Next.js داخليًا فقط: `127.0.0.1:3310`
- الباكند API داخليًا فقط: `127.0.0.1:4310`
- Nginx خارجيًا للمستخدمين: `http://SERVER_IP:8088`

يمكن تغيير `8088` إذا كان مستخدمًا من مشروع آخر.

## لماذا هذا مهم للـ rate limit والمشاهدات؟

الـ API مضبوط على `TRUST_PROXY=1`، وNginx يرسل:

- `X-Real-IP`
- `X-Forwarded-For`
- `X-Forwarded-Proto`

بهذا يقرأ Express عنوان IP الحقيقي للزائر من `req.ip` بدل أن يرى كل الطلبات كأنها من `127.0.0.1` أو IP الخاص بـ Nginx. هذا يؤثر مباشرة على:

- `apiRateLimiter`
- تسجيل مشاهدات الإعلانات

مهم: اجعل API يعمل على `HOST=127.0.0.1` ولا تفتح بورت `4310` للعامة، حتى لا يستطيع أحد إرسال `X-Forwarded-For` مزيف مباشرة إلى الباكند.

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
PORT=4310
TRUST_PROXY=1
API_URL=http://SERVER_IP:8088
WEB_URL=http://SERVER_IP:8088
CORS_ORIGINS=http://SERVER_IP:8088
```

عدّل `apps/web/.env.production`:

```env
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_API_PORT=4310
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

## تشغيل الخدمات بـ PM2

```bash
sudo npm install -g pm2

HOST=127.0.0.1 PORT=4310 pm2 start npm --name omansale-api -- --workspace @oman-sale/api run start
HOSTNAME=127.0.0.1 PORT=3310 pm2 start npm --name omansale-web -- --workspace @oman-sale/web run start
pm2 start npm --name omansale-jobs -- --workspace @oman-sale/jobs run start

pm2 save
pm2 startup
```

## إعداد Nginx

استخدم الملف:

```bash
infra/nginx/omansale-vps.conf.example
```

انسخه إلى Nginx:

```bash
sudo cp infra/nginx/omansale-vps.conf.example /etc/nginx/sites-available/omansale
sudo ln -s /etc/nginx/sites-available/omansale /etc/nginx/sites-enabled/omansale
sudo nginx -t
sudo systemctl reload nginx
```

افتح البورت في الجدار الناري:

```bash
sudo ufw allow 8088/tcp
```

ثم افتح:

```text
http://SERVER_IP:8088
```

## فحص سريع

```bash
curl http://SERVER_IP:8088/api/v1/health
```

يجب أن يرجع:

```json
{"status":"ok","service":"oman-sale-api"}
```

## ملاحظات عند إضافة دومين لاحقًا

عند توفر دومين:

- غيّر `server_name _;` في Nginx إلى الدومين.
- غيّر `WEB_URL` و`API_URL` و`CORS_ORIGINS`.
- أبقِ `NEXT_PUBLIC_API_URL=/api/v1` إذا ستستمر بالاتصال عبر نفس الدومين.
- أعد build للواجهة.
