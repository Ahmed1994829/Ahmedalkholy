# Ahmed alkholy Chat App

تطبيق دردشة عربي/إنجليزي يعمل عبر Firebase Authentication وCloud Firestore، ويمكن تغليفه كتطبيق Android باستخدام Capacitor.

## المزايا الحالية
- إنشاء حساب وتسجيل الدخول بالبريد الإلكتروني وكلمة المرور.
- ملف شخصي بسيط.
- إضافة صديق باستخدام Firebase UID.
- محادثات نصية مباشرة ورسائل لحظية.
- حالات نصية تنتهي بعد 24 ساعة.
- واجهة عربية/إنجليزية متجاوبة.
- لا يستخدم Firebase Storage؛ الصور والملفات والمرفقات مؤجلة.

## إعداد Firebase
1. من Firebase Console افتح Authentication ثم Sign-in method وفعّل Email/Password.
2. افتح Firestore Database وأنشئ قاعدة بيانات.
3. من Firestore Rules الصق محتوى `firestore.rules` ثم انشر القواعد.
4. أنشئ فهرساً مركباً عند طلب Firebase لذلك: `stories` على `expiresAt` (Ascending) مع الاستعلام الحالي.

## التشغيل المحلي
```bash
npm install
npm run dev
```

## بناء APK
المستودع يتضمن GitHub Actions في `.github/workflows/build-apk.yml`.
بعد رفع **محتويات المشروع المستخرجة** إلى جذر المستودع على الفرع `main`، افتح تبويب Actions وشغّل `Build Ahmed alkholy APK` أو انتظر تشغيله بعد push. عند النجاح نزّل artifact باسم `Ahmed-alkholy-debug-apk` واستخرج `app-debug.apk`.

## تنبيه أمان
مفتاح Firebase Web API المستخدم في `src/firebase.js` مخصص لتطبيقات الويب وليس كلمة مرور إدارية. أمان البيانات يعتمد على قواعد Firestore المنشورة أعلاه. لا تضع Service Account أو مفاتيح خاصة أو كلمات مرور في المستودع العام.
