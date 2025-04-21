#!/bin/bash
# سكريبت نشر تطبيق أتمتة تيك توك المحدث
# تاريخ التحديث: 21 أبريل 2025

set -e

echo "بدء عملية نشر تطبيق أتمتة تيك توك المحدث..."

# تحديد المسارات
APP_DIR="/home/ubuntu/tiktok_web"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR"
DEPLOY_DIR="/var/www/tiktok-automation"
LOGS_DIR="/var/log/tiktok-automation"

# إنشاء دليل النشر والسجلات إذا لم تكن موجودة
sudo mkdir -p $DEPLOY_DIR
sudo mkdir -p $LOGS_DIR
sudo chown -R ubuntu:ubuntu $DEPLOY_DIR
sudo chown -R ubuntu:ubuntu $LOGS_DIR

echo "تحديث حزم النظام..."
sudo apt-get update
sudo apt-get install -y nginx python3-pip nodejs npm

echo "تثبيت متطلبات Python..."
cd $BACKEND_DIR
pip3 install -r requirements.txt

echo "بناء تطبيق الواجهة الأمامية..."
cd $FRONTEND_DIR
npm install
npm run build

echo "نسخ ملفات الواجهة الأمامية إلى دليل النشر..."
cp -r $FRONTEND_DIR/build/* $DEPLOY_DIR/

echo "إعداد ملف خدمة systemd..."
sudo cp $BACKEND_DIR/tiktok-automation.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tiktok-automation.service

echo "إعداد تكوين Nginx..."
sudo cp $BACKEND_DIR/nginx.conf /etc/nginx/sites-available/tiktok-automation
sudo ln -sf /etc/nginx/sites-available/tiktok-automation /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# إنشاء ملف .env للمتغيرات البيئية
echo "إعداد متغيرات البيئة..."
cat > $BACKEND_DIR/.env << EOL
# متغيرات بيئة تطبيق أتمتة تيك توك
JWT_SECRET_KEY=$(openssl rand -hex 32)
ALLOWED_ORIGINS=https://tiktok-automation.example.com,http://localhost:3000
ENVIRONMENT=production
EOL

echo "إعادة تشغيل الخدمات..."
sudo systemctl restart tiktok-automation.service
sudo systemctl restart nginx

echo "اختبار الاتصال بالتطبيق..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs

echo "تم نشر تطبيق أتمتة تيك توك المحدث بنجاح!"
echo "يمكن الوصول إلى التطبيق من خلال: https://tiktok-automation.example.com"
echo "تأكد من تكوين اسم النطاق الخاص بك ليشير إلى عنوان IP الخادم."
