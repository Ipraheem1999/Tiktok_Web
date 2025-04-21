#!/bin/bash

# هذا السكريبت يقوم بنشر موقع أتمتة تيك توك في بيئة الإنتاج

# التأكد من تشغيل السكريبت بصلاحيات الجذر
if [ "$EUID" -ne 0 ]; then
  echo "يرجى تشغيل هذا السكريبت بصلاحيات الجذر (sudo)"
  exit 1
fi

# تعيين المتغيرات
DEPLOY_DIR="/var/www/tiktok_web"
APP_DIR="/home/ubuntu/tiktok_web"
DOMAIN="tiktok-automation.example.com"

echo "بدء عملية نشر موقع أتمتة تيك توك..."

# إنشاء مجلد النشر
echo "إنشاء مجلد النشر..."
mkdir -p $DEPLOY_DIR

# نسخ ملفات التطبيق
echo "نسخ ملفات التطبيق..."
cp -r $APP_DIR/* $DEPLOY_DIR/

# تشغيل سكريبت إعداد الإنتاج
echo "إعداد ملفات الإنتاج..."
cd $DEPLOY_DIR
./prepare_production.sh

# تثبيت وتكوين Nginx
echo "تثبيت وتكوين Nginx..."
apt-get update
apt-get install -y nginx

# نسخ ملف تكوين Nginx
echo "نسخ ملف تكوين Nginx..."
cp $DEPLOY_DIR/nginx.conf /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# إعادة تشغيل Nginx
echo "إعادة تشغيل Nginx..."
systemctl restart nginx

# تثبيت خدمة systemd
echo "تثبيت خدمة systemd..."
cp $DEPLOY_DIR/tiktok-automation.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable tiktok-automation
systemctl start tiktok-automation

echo "اكتمل نشر موقع أتمتة تيك توك بنجاح!"
echo "يمكنك الوصول إلى الموقع من خلال: http://$DOMAIN"
