# بناء APK لتطبيق Oman Sale (EAS)

## المتطلبات

1. حساب [Expo](https://expo.dev)
2. تثبيت EAS CLI: `npm install -g eas-cli`
3. تسجيل الدخول: `eas login`

## الإعداد لأول مرة

```bash
cd apps/mobile
npm install
```

المشروع مربوط بـ Expo. معرّف المشروع في `app.json` → `extra.eas.projectId`.

### 1) اعتمادات Android (مرة واحدة فقط)

عند أول بناء، EAS يحتاج **Keystore** لتوقيع APK. لا يمكن إنشاؤه تلقائياً في الوضع غير التفاعلي.

شغّل (تفاعلي — اختر **Set up a new keystore** عندما يُسأل):

```bash
npm run credentials:android
```

أو مباشرة أثناء أول بناء تفاعلي:

```bash
npm run build:android:preview
```

وافق على إنشاء Keystore جديد على خوادم Expo.

بعد حفظ الاعتمادات على Expo، يمكن استخدام `:ci` في CI:

```bash
npm run build:android:preview:ci
```

## متغيرات البيئة (الإنتاج)

في `eas.json` لكل ملفات البناء:

```
EXPO_PUBLIC_API_URL=https://omansale.om/api/v1
EXPO_PUBLIC_API_DEBUG=false
```

للتطوير المحلي: انسخ `.env.example` إلى `.env`.

## بناء APK

```bash
cd apps/mobile
npm run build:android:preview
```

أو إنتاج:

```bash
npm run build:android:production
```

بعد اكتمال البناء:

```bash
eas build:list
eas build:download -p android --latest
```

## استكشاف الأخطاء

| الخطأ | الحل |
|--------|------|
| `Generating a new Keystore is not supported in --non-interactive mode` | شغّل `npm run build:android:preview` **بدون** `:ci` مرة واحدة، أو `npm run credentials:android` |
| `project:init` و `app.config.js` | `projectId` موجود في `app.json` و`app.config.js` |

## ملاحظات

- **HTTPS فقط** في بناء EAS.
- Socket.IO من `https://omansale.om` (بدون `/api/v1`).
- Google Play لاحقاً: غيّر `buildType` إلى `app-bundle` في `eas.json`.
