#!/bin/bash

# إعداد ملف الإنتاج للواجهة الأمامية
cd /home/ubuntu/tiktok_web/frontend

# تثبيت حزم الإنتاج
echo "تثبيت حزم الإنتاج للواجهة الأمامية..."
npm install --production

# بناء الإصدار النهائي
echo "بناء الإصدار النهائي للواجهة الأمامية..."
npm run build

# إعداد ملف الإنتاج للواجهة الخلفية
cd /home/ubuntu/tiktok_web

# تثبيت حزم الإنتاج
echo "تثبيت حزم الإنتاج للواجهة الخلفية..."
pip3 install -r requirements.txt

# إنشاء ملف متطلبات الإنتاج
echo "إنشاء ملف متطلبات الإنتاج..."
pip3 freeze > requirements.txt

echo "اكتمل إعداد ملفات الإنتاج بنجاح!"
