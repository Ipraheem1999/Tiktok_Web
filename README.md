# دليل نشر تطبيق أتمتة تيك توك المحدث

تم تحديث تطبيق أتمتة تيك توك بالعديد من التحسينات والإصلاحات. يوفر هذا الدليل خطوات نشر التطبيق المحدث في بيئة الإنتاج.

## التحسينات الرئيسية

1. **إصلاح الأخطاء البرمجية**:
   - إضافة مكون `FollowForm.js` المفقود
   - إصلاح تكوين عنوان API للعمل في بيئة الإنتاج

2. **تحسينات الأداء**:
   - تنفيذ التحميل المتأخر (Lazy Loading) للمكونات
   - تقسيم الشيفرة (Code Splitting)
   - تحسين إدارة الحالة باستخدام React.memo وuseMemo وuseCallback
   - استبدال البيانات الوهمية بطلبات API حقيقية

3. **تحسينات الأمان**:
   - تحسين التحقق من صحة البيانات المدخلة
   - تحسين إدارة التوكن وتقليل مدة صلاحيته
   - الحماية من هجمات القوة الغاشمة
   - تحسين إعدادات CORS
   - إضافة رؤوس أمان HTTP
   - تحسين أمان تحميل الملفات
   - إضافة وسيط المضيفين الموثوقين
   - تحسين معالجة الأخطاء

## متطلبات النظام

- Ubuntu 20.04 أو أحدث
- Python 3.8 أو أحدث
- Node.js 14 أو أحدث
- Nginx
- اسم نطاق مخصص (اختياري)

## خطوات النشر

### 1. تحضير الخادم

تأكد من تثبيت المتطلبات الأساسية:

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv nodejs npm nginx
```

### 2. نسخ الشيفرة المصدرية

انسخ الشيفرة المصدرية إلى الخادم:

```bash
git clone https://github.com/yourusername/tiktok-automation.git
cd tiktok-automation
```

أو قم بتحميل الملفات مباشرة إلى الخادم.

### 3. استخدام سكريبت النشر الآلي

تم توفير سكريبت نشر آلي يقوم بجميع الخطوات اللازمة:

```bash
chmod +x deploy_updated.sh
sudo ./deploy_updated.sh
```

هذا السكريبت سيقوم بـ:
- تثبيت جميع المتطلبات
- بناء تطبيق الواجهة الأمامية
- إعداد خدمة systemd
- تكوين Nginx
- إنشاء ملف متغيرات البيئة مع مفتاح JWT عشوائي
- إعادة تشغيل الخدمات

### 4. النشر اليدوي (بديل)

إذا كنت تفضل النشر اليدوي، اتبع الخطوات التالية:

#### 4.1 إعداد البيئة الافتراضية وتثبيت المتطلبات

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 4.2 بناء تطبيق الواجهة الأمامية

```bash
cd frontend
npm install
npm run build
```

#### 4.3 إعداد ملف متغيرات البيئة

أنشئ ملف `.env` في الدليل الرئيسي:

```
JWT_SECRET_KEY=<مفتاح_عشوائي_طويل>
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000
ENVIRONMENT=production
```

يمكنك توليد مفتاح عشوائي باستخدام:

```bash
openssl rand -hex 32
```

#### 4.4 إعداد خدمة systemd

أنشئ ملف `/etc/systemd/system/tiktok-automation.service`:

```ini
[Unit]
Description=TikTok Automation Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/path/to/tiktok_web
ExecStart=/path/to/venv/bin/python main.py
Restart=always
Environment=PYTHONUNBUFFERED=1
EnvironmentFile=/path/to/tiktok_web/.env

[Install]
WantedBy=multi-user.target
```

ثم قم بتفعيل وتشغيل الخدمة:

```bash
sudo systemctl daemon-reload
sudo systemctl enable tiktok-automation.service
sudo systemctl start tiktok-automation.service
```

#### 4.5 إعداد Nginx

أنشئ ملف `/etc/nginx/sites-available/tiktok-automation`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

فعّل التكوين وأعد تشغيل Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/tiktok-automation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. إعداد HTTPS (موصى به)

للحصول على شهادة SSL مجانية من Let's Encrypt:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 6. التحقق من النشر

تأكد من أن التطبيق يعمل بشكل صحيح:

```bash
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com
```

يجب أن تحصل على الرمز 200.

يمكنك أيضًا تشغيل سكريبت الاختبار للتحقق من جميع الوظائف:

```bash
python test_improvements.py
```

## استكشاف الأخطاء وإصلاحها

### التحقق من حالة الخدمة

```bash
sudo systemctl status tiktok-automation.service
```

### عرض سجلات الخدمة

```bash
sudo journalctl -u tiktok-automation.service
```

### التحقق من سجلات Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### مشاكل شائعة

1. **خطأ 502 Bad Gateway**: تأكد من أن خدمة tiktok-automation تعمل.
2. **مشاكل CORS**: تأكد من تكوين ALLOWED_ORIGINS بشكل صحيح.
3. **مشاكل المصادقة**: تحقق من JWT_SECRET_KEY وتأكد من أنه متطابق بين عمليات إعادة التشغيل.

## الصيانة

### تحديث التطبيق

لتحديث التطبيق بعد تغييرات جديدة:

```bash
# تحديث الشيفرة المصدرية
git pull  # أو قم بتحميل الملفات المحدثة

# إعادة بناء الواجهة الأمامية
cd frontend
npm install
npm run build

# إعادة تشغيل الخدمة
sudo systemctl restart tiktok-automation.service
```

### النسخ الاحتياطي

قم بعمل نسخة احتياطية لقاعدة البيانات بانتظام:

```bash
cp /path/to/tiktok_web/tiktok_web.db /path/to/backups/tiktok_web_$(date +%Y%m%d).db
```

## الدعم

إذا واجهت أي مشاكل أثناء النشر، يرجى الاتصال بفريق الدعم أو فتح مشكلة في مستودع GitHub.
