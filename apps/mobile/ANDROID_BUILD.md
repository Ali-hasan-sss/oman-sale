# بناء نسخة أندرويد للإنتاج محلياً

دليل تصدير APK/AAB موقّع على جهازك (بدون سيرفرات EAS السحابية).

## المتطلبات
- JDK 17 (متوفّر: `keytool`, `java`)
- `eas-cli` (متوفّر عبر `npx eas`)
- Android SDK + متغيّر البيئة `ANDROID_HOME` (لبناء gradle المحلي)

## 1) متغيّرات البيئة
انسخ القالب واملأ القيم:

```powershell
Copy-Item .env.example .env
```

أهم المتغيّرات للإنتاج (داخل `apps/mobile/.env`):

| المتغيّر | الغرض |
|----------|-------|
| `EXPO_PUBLIC_API_URL` | رابط الـ API للإنتاج (`https://omansale.om/api/v1`) |
| `EXPO_PUBLIC_API_DEBUG` | `false` في الإنتاج |
| `EAS_PROJECT_ID` | معرّف مشروع EAS (اختياري، له قيمة افتراضية) |
| `ANDROID_VERSION_CODE` | رقم الإصدار، يُزاد مع كل رفع للمتجر |
| `GOOGLE_SERVICES_JSON` | مسار `google-services.json` (افتراضي: `./google-services.json`) |

> ملاحظة: عند البناء عبر `eas build` تُؤخذ متغيّرات `EXPO_PUBLIC_*` من `eas.json` (قسم `env`)، وليس من `.env`.

## 2) ملف Firebase (مطلوب للإشعارات/الدفع)
1. Firebase Console → Project settings → Your apps → Android.
2. تأكّد أن تطبيق أندرويد مسجّل بالحزمة: `com.omansale.mobile`.
3. نزّل `google-services.json` وضعه في `apps/mobile/google-services.json`.

> يجب أن يكون من نفس مشروع Firebase الذي يستخدمه الـ API (`oman-sale-5f29c`) حتى يعمل الدفع عبر FCM.

## 3) إنشاء keystore جديد
```powershell
npm run keystore:generate
```
- يولّد `credentials/omansale-release.keystore`.
- يكتب `credentials.json` تلقائياً (يستخدمه EAS للتوقيع محلياً).
- **احفظ كلمات المرور المطبوعة** — فقدانها يمنع تحديث التطبيق لاحقاً على المتجر.

لكلمات مرور مخصّصة:
```powershell
$env:KEYSTORE_PASSWORD="..."; $env:KEY_PASSWORD="..."; npm run keystore:generate
```

(بديل يدوي: انسخ `credentials.json.example` إلى `credentials.json` وولّد keystore بنفسك عبر `keytool`.)

## 4) البناء المحلي
APK (للتثبيت المباشر/التجربة):
```powershell
npm run build:android:local
```
الناتج: `apps/mobile/build-output/omansale.apk`

AAB (للرفع إلى Google Play):
```powershell
npm run build:android:local:aab
```
الناتج: `apps/mobile/build-output/omansale.aab`

## الملفات الحساسة (غير مرفوعة على Git)
`google-services.json`, `credentials.json`, `credentials/`, `*.keystore`, ومخرجات البناء — كلها مستثناة في `.gitignore`.

## استكشاف الأخطاء
- **فشل التوقيع / لا يوجد keystore**: شغّل `npm run keystore:generate` أولاً.
- **الدفع لا يعمل**: تأكد من وجود `google-services.json` الصحيح وأن الحزمة `com.omansale.mobile` مسجّلة في Firebase.
- **رقم الإصدار مرفوض من المتجر**: زِد `ANDROID_VERSION_CODE`.
- **فشل `eas build --local` على ويندوز**: قد يتطلب WSL2؛ كبديل استخدم `npx expo prebuild -p android` ثم `cd android && ./gradlew assembleRelease`.
