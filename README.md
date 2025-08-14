# Qaadi Live

واجهة ويب لخدمات Qaadi مبنية على Next.js.

## التشغيل محليًا

1. تثبيت الاعتمادات:
   ```bash
   npm install
   ```
2. تشغيل الخادم التطويري:
   ```bash
   npm run dev
   ```
   بعدها سيكون التطبيق متاحًا على `http://localhost:3000`.

## إعداد المفاتيح

تحتاج نقاط واجهة البرمجة (API) الخاصة بالتوليد والتنزيل إلى مفاتيح مزود الخدمة. استخدم الرؤوس التالية مع الطلبات:

```
X-OpenAI-Key: مفتاح OpenAI الخاص بك
X-DeepSeek-Key: مفتاح DeepSeek الخاص بك
```

يمكن تعريف هذه المفاتيح كمتغيرات بيئية عند استخدام سكربتات الاختبار:

```bash
export OPENAI_KEY=sk-...
export DEEPSEEK_KEY=ds-...
```

## الاختبارات

توجد سكربتات `curl` تحت مجلد `tests/`:

```bash
bash tests/health.sh
bash tests/generate.sh
bash tests/export.sh
```

## الكتيّب والمساهمة

- [كتيّب Qaadi](https://github.com/qaadi/handbook)
- المساهمة متاحة عبر فتح القضايا (issues) أو إرسال طلبات السحب على GitHub.

