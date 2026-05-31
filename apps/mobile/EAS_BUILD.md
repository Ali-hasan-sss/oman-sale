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

قبل البناء (موصى به — **مع Expo SDK 54 فقط**):

```bash
cd apps/mobile
npx expo install --fix
```

> **تحذير:** لا تشغّل `npx expo install --fix` بعد ترقية `expo` يدوياً إلى SDK 56. يخلط إصدارات الحزم ويفشل البناء بخطأ `VirtualViewExperimentalNativeComponent` / `onModeChange`.

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
| تحذير Play Protect: «لم يسبق نشر تطبيق من هذا المطور» | **طبيعي** لـ APK خارج Google Play (توزيع داخلي). اختر **تثبيت على أي حال** / **Install anyway**. |
| «لم يتم تثبيت التطبيق» / «App not installed» بعد التحذير | انظر [فشل التثبيت على الجهاز](#فشل-التثبيت-على-الجهاز) أدناه |
| فشل التثبيت **فقط في آخر APK** (Android 15) | غالباً `targetSdkVersion: 35` + محاذاة 16KB. المشروع يستخدم **targetSdk 34** للـ preview حتى يثبت. قبل Play: `npx expo install --fix` ثم ارفع target إلى 35. |

### فشل التثبيت على الجهاز

1. **احذف أي نسخة قديمة** باسم Oman Sale أو الحزمة `com.omansale.mobile` (إعدادات → التطبيقات → إلغاء التثبيت).  
   سبب شائع: نسخة سابقة من Expo Go أو `expo run:android` أو APK قديم **موقّع بمفتاح مختلف** — Android يرفض التحديث ويظهر «لم يتم التثبيت» بدون تفاصيل.

2. **حمّل ملف APK كاملاً** على الهاتف (لا تعتمد فقط على صفحة المتصفح إن فشلت):
   ```bash
   cd apps/mobile
   eas build:download -p android --latest
   ```
   انقل الملف إلى الهاتف وافتحه من تطبيق **الملفات**.

3. **السماح بالتثبيت من مصدر غير معروف** لنفس التطبيق الذي فتحت منه الـ APK (Chrome، Files، Drive…) — إعدادات → الأمان → تثبيت تطبيقات غير معروفة.

4. تأكد من **مساحة تخزين كافية** وإعادة تشغيل الهاتف بعد الحذف.

5. إذا أعدت بناء APK بعد تغيير Keystore في Expo، **يجب** حذف النسخة القديمة قبل التثبيت.

6. للتجربة على المحاكي: من الرابط في `eas build:list` اختر **Download** ثم اسحب الـ APK إلى المحاكي (لا تستخدم QR من جهاز حقيقي على محاكي مختلف).

## دعم إصدارات Android

| الإعداد | القيمة | المعنى |
|--------|--------|--------|
| `minSdkVersion` | **24** | يعمل من **Android 7.0** فما فوق (يشمل **Android 12** = API 31) |
| `targetSdkVersion` | **34** | توافق أوسع عند التثبيت اليدوي |
| `REACT_NATIVE_ARCHITECTURES` | arm32 + arm64 + x86 | APK واحد لمعظم الهواتف والمحاكيات |

إذا ثبّت على جهاز ولم يثبت على آخر (مثل Android 12):

1. احذف أي نسخة قديمة من التطبيق على الجهاز الثاني.
2. تأكد أنك تثبّت **نفس APK** (الملف الكامل، وليس رابطاً قديماً).
3. إن فشل التثبيت فقط على جهاز قديم 32-bit، أعد البناء بعد التعديلات أعلاه.

## شريط الإرسال في المحادثة (الكيبورد)

بعد تعديل سلوك الكيبورد يجب **بناء APK جديد** (`eas build -p android --profile preview`) — التغييرات لا تظهر في APK قديم ولا في Expo Go فقط.

- الإضافة `expo-android-keyboard-fix` تصلح `adjustResize` على أندرويد الحديث.
- التطبيق يرفع شريط الإرسال يدوياً على أندرويد إذا لم يتقلص ارتفاع النافذة (شائع في EAS).

## ملاحظات

- **HTTPS فقط** في بناء EAS.
- Socket.IO من `https://omansale.om` (بدون `/api/v1`).
- Google Play لاحقاً: غيّر `buildType` إلى `app-bundle` في `eas.json`.
