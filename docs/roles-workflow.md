# دليل مراحل العمل

هذا الدليل يشرح مراحل سير العمل من السكرتير إلى الصحفي ويبين الحقول الإلزامية لكل مرحلة، أمثلة الإدخال وصيغ الملفات المدعومة، إضافة إلى مخططات للواجهات والمؤشرات البصرية.

## المخطط العام للمراحل
```mermaid
flowchart LR
    S["السكرتير"] --> J["القاضي"]
    J --> C["المستشار"]
    C --> H["رئيس القسم"]
    H --> R["الصحفي"]
```

## السكرتير
### الحقول الإلزامية
- رقم القضية
- تاريخ الإدخال
- المستندات المرفوعة

### مثال إدخال
```json
{
  "caseNumber": "2024-001",
  "submissionDate": "2024-05-20",
  "documents": ["petition.pdf"]
}
```

### صيغ الملفات
- PDF
- DOCX

### مخطط الواجهة والمؤشرات
```mermaid
flowchart TB
    subgraph واجهة السكرتير
        direction TB
        A[رقم القضية] --> B[تحميل المستند]
        B --> C[زر الإرسال]
        C --> D((تم الحفظ))
    end
    classDef saved fill:#c6f6d5,stroke:#2f855a;
    class D saved;
```

## القاضي
### الحقول الإلزامية
- رقم القضية
- نص الحكم
- حالة الحكم

### مثال إدخال
```json
{
  "caseNumber": "2024-001",
  "verdict": "قبول الدعوى",
  "status": "approved"
}
```

### صيغ الملفات
- TXT
- PDF

### مخطط الواجهة والمؤشرات
```mermaid
flowchart TB
    subgraph واجهة القاضي
        direction TB
        A[نص الحكم] --> B{حالة}
        B -->|مقبول| C[مؤشر أخضر]
        B -->|مرفوض| D[مؤشر أحمر]
    end
    classDef green fill:#c6f6d5,stroke:#2f855a;
    classDef red fill:#fed7d7,stroke:#c53030;
    class C green;
    class D red;
```

## المستشار
### الحقول الإلزامية
- رقم القضية
- التوصية
- التعليقات

### مثال إدخال
```json
{
  "caseNumber": "2024-001",
  "recommendation": "عرض القضية على رئيس القسم",
  "notes": "تمت المراجعة"
}
```

### صيغ الملفات
- MD
- PDF

### مخطط الواجهة والمؤشرات
```mermaid
flowchart TB
    subgraph واجهة المستشار
        direction TB
        A[التوصية] --> B((علامة التحقق))
    end
    classDef check fill:#c6f6d5,stroke:#2f855a;
    class B check;
```

## رئيس القسم
### الحقول الإلزامية
- رقم القضية
- قرار الاعتماد
- ملخص نهائي

### مثال إدخال
```json
{
  "caseNumber": "2024-001",
  "approval": true,
  "summary": "الموافقة على النشر"
}
```

### صيغ الملفات
- PDF
- HTML

### مخطط الواجهة والمؤشرات
```mermaid
flowchart TB
    subgraph واجهة رئيس القسم
        direction TB
        A[قرار الاعتماد] --> B[شريط الحالة]
        B --> C[مؤشر أخضر]
    end
    classDef green fill:#c6f6d5,stroke:#2f855a;
    class C green;
```

## الصحفي
### الحقول الإلزامية
- رقم القضية
- عنوان المقال
- نص المقال

### مثال إدخال
```json
{
  "caseNumber": "2024-001",
  "title": "القضية تتصدر العناوين",
  "body": "نص المقال النهائي..."
}
```

### صيغ الملفات
- MD
- HTML

### مخطط الواجهة والمؤشرات
```mermaid
flowchart TB
    subgraph واجهة الصحفي
        direction TB
        A[عنوان المقال] --> B[نص المقال]
        B --> C((تم النشر))
    end
    classDef publish fill:#c6f6d5,stroke:#2f855a;
    class C publish;
```

