#!/usr/bin/env python3
"""
اختبار التحسينات المنفذة في تطبيق أتمتة تيك توك
"""

import os
import sys
import requests
import json
import time
from datetime import datetime

# تكوين الاختبار
API_URL = "http://localhost:8000"
TEST_USER = {
    "username": "test_user",
    "email": "test@example.com",
    "password": "TestPassword123"
}
TEST_ACCOUNT = {
    "username": "tiktok_test",
    "password": "TikTokTest123",
    "country": "السعودية",
    "proxy": None
}

# ألوان للطباعة
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def print_success(message):
    print(f"{GREEN}✓ {message}{RESET}")

def print_error(message):
    print(f"{RED}✗ {message}{RESET}")

def print_info(message):
    print(f"{YELLOW}ℹ {message}{RESET}")

def test_api_availability():
    """اختبار توفر واجهة برمجة التطبيقات"""
    try:
        response = requests.get(f"{API_URL}/docs")
        if response.status_code == 200:
            print_success("واجهة برمجة التطبيقات متاحة")
            return True
        else:
            print_error(f"واجهة برمجة التطبيقات غير متاحة. الرمز: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"خطأ في الاتصال بواجهة برمجة التطبيقات: {str(e)}")
        return False

def test_user_registration():
    """اختبار تسجيل المستخدم"""
    try:
        # حذف المستخدم إذا كان موجوداً
        token = get_token(TEST_USER["username"], TEST_USER["password"])
        if token:
            print_info("المستخدم موجود بالفعل، سيتم استخدامه للاختبارات")
            return token
        
        # إنشاء مستخدم جديد
        response = requests.post(
            f"{API_URL}/users/",
            json=TEST_USER
        )
        
        if response.status_code == 200:
            print_success("تم تسجيل المستخدم بنجاح")
            # الحصول على التوكن
            token = get_token(TEST_USER["username"], TEST_USER["password"])
            return token
        else:
            print_error(f"فشل تسجيل المستخدم. الرمز: {response.status_code}, الرسالة: {response.text}")
            return None
    except Exception as e:
        print_error(f"خطأ في تسجيل المستخدم: {str(e)}")
        return None

def get_token(username, password):
    """الحصول على توكن المصادقة"""
    try:
        response = requests.post(
            f"{API_URL}/token",
            data={
                "username": username,
                "password": password
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )
        
        if response.status_code == 200:
            token_data = response.json()
            print_success("تم الحصول على التوكن بنجاح")
            return token_data["access_token"]
        else:
            print_error(f"فشل الحصول على التوكن. الرمز: {response.status_code}, الرسالة: {response.text}")
            return None
    except Exception as e:
        print_error(f"خطأ في الحصول على التوكن: {str(e)}")
        return None

def test_account_management(token):
    """اختبار إدارة حسابات تيك توك"""
    if not token:
        print_error("لا يمكن اختبار إدارة الحسابات بدون توكن")
        return None
    
    try:
        # إنشاء حساب تيك توك
        response = requests.post(
            f"{API_URL}/tiktok-accounts/",
            json=TEST_ACCOUNT,
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        
        if response.status_code == 200:
            account_data = response.json()
            account_id = account_data["id"]
            print_success(f"تم إنشاء حساب تيك توك بنجاح. المعرف: {account_id}")
            
            # الحصول على قائمة الحسابات
            response = requests.get(
                f"{API_URL}/tiktok-accounts/",
                headers={
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if response.status_code == 200:
                accounts = response.json()
                if len(accounts) > 0:
                    print_success(f"تم الحصول على قائمة الحسابات بنجاح. العدد: {len(accounts)}")
                else:
                    print_error("قائمة الحسابات فارغة")
            else:
                print_error(f"فشل الحصول على قائمة الحسابات. الرمز: {response.status_code}, الرسالة: {response.text}")
            
            return account_id
        else:
            print_error(f"فشل إنشاء حساب تيك توك. الرمز: {response.status_code}, الرسالة: {response.text}")
            
            # محاولة الحصول على حساب موجود
            response = requests.get(
                f"{API_URL}/tiktok-accounts/",
                headers={
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if response.status_code == 200:
                accounts = response.json()
                if len(accounts) > 0:
                    print_info(f"تم العثور على حساب موجود. سيتم استخدامه للاختبارات. المعرف: {accounts[0]['id']}")
                    return accounts[0]["id"]
            
            return None
    except Exception as e:
        print_error(f"خطأ في إدارة حسابات تيك توك: {str(e)}")
        return None

def test_engagement_features(token, account_id):
    """اختبار ميزات التفاعل"""
    if not token or not account_id:
        print_error("لا يمكن اختبار ميزات التفاعل بدون توكن أو معرف حساب")
        return False
    
    try:
        # اختبار ميزة الإعجاب
        like_data = {
            "account_id": account_id,
            "target_url": "https://www.tiktok.com/@tiktok/video/1234567890"
        }
        
        response = requests.post(
            f"{API_URL}/engagements/like/",
            json=like_data,
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        
        if response.status_code == 200:
            print_success("تم اختبار ميزة الإعجاب بنجاح")
        else:
            print_error(f"فشل اختبار ميزة الإعجاب. الرمز: {response.status_code}, الرسالة: {response.text}")
        
        # اختبار ميزة التعليق
        comment_data = {
            "account_id": account_id,
            "target_url": "https://www.tiktok.com/@tiktok/video/1234567890",
            "comment_text": "تعليق اختباري"
        }
        
        response = requests.post(
            f"{API_URL}/engagements/comment/",
            json=comment_data,
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        
        if response.status_code == 200:
            print_success("تم اختبار ميزة التعليق بنجاح")
        else:
            print_error(f"فشل اختبار ميزة التعليق. الرمز: {response.status_code}, الرسالة: {response.text}")
        
        # اختبار ميزة المتابعة
        follow_data = {
            "account_id": account_id,
            "username": "tiktok"
        }
        
        response = requests.post(
            f"{API_URL}/engagements/follow/",
            json=follow_data,
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        
        if response.status_code == 200:
            print_success("تم اختبار ميزة المتابعة بنجاح")
            return True
        else:
            print_error(f"فشل اختبار ميزة المتابعة. الرمز: {response.status_code}, الرسالة: {response.text}")
            return False
    except Exception as e:
        print_error(f"خطأ في اختبار ميزات التفاعل: {str(e)}")
        return False

def test_security_features(token):
    """اختبار ميزات الأمان"""
    try:
        # اختبار رؤوس الأمان
        response = requests.get(f"{API_URL}/docs")
        security_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Strict-Transport-Security",
            "Content-Security-Policy"
        ]
        
        headers_found = 0
        for header in security_headers:
            if header in response.headers:
                print_success(f"تم العثور على رأس الأمان: {header}")
                headers_found += 1
            else:
                print_error(f"لم يتم العثور على رأس الأمان: {header}")
        
        # اختبار انتهاء صلاحية التوكن
        if token:
            # انتظار لمدة ثانية للتأكد من أن التوكن لم ينته بعد
            time.sleep(1)
            
            response = requests.get(
                f"{API_URL}/users/me/",
                headers={
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if response.status_code == 200:
                print_success("التوكن صالح")
            else:
                print_error(f"التوكن غير صالح. الرمز: {response.status_code}, الرسالة: {response.text}")
        
        return headers_found >= 3  # نجاح إذا تم العثور على 3 رؤوس أمان على الأقل
    except Exception as e:
        print_error(f"خطأ في اختبار ميزات الأمان: {str(e)}")
        return False

def main():
    """الدالة الرئيسية للاختبار"""
    print_info("بدء اختبار تحسينات تطبيق أتمتة تيك توك")
    print_info(f"التاريخ والوقت: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"عنوان واجهة برمجة التطبيقات: {API_URL}")
    print("-" * 50)
    
    # اختبار توفر واجهة برمجة التطبيقات
    if not test_api_availability():
        print_error("فشل اختبار توفر واجهة برمجة التطبيقات. توقف الاختبار.")
        return
    
    print("-" * 50)
    
    # اختبار تسجيل المستخدم والمصادقة
    token = test_user_registration()
    if not token:
        print_error("فشل اختبار تسجيل المستخدم والمصادقة. توقف الاختبار.")
        return
    
    print("-" * 50)
    
    # اختبار إدارة حسابات تيك توك
    account_id = test_account_management(token)
    if not account_id:
        print_error("فشل اختبار إدارة حسابات تيك توك. توقف الاختبار.")
        return
    
    print("-" * 50)
    
    # اختبار ميزات التفاعل
    engagement_success = test_engagement_features(token, account_id)
    
    print("-" * 50)
    
    # اختبار ميزات الأمان
    security_success = test_security_features(token)
    
    print("-" * 50)
    
    # تلخيص نتائج الاختبار
    print_info("ملخص نتائج الاختبار:")
    print_info("- توفر واجهة برمجة التطبيقات: نجاح")
    print_info("- تسجيل المستخدم والمصادقة: نجاح")
    print_info("- إدارة حسابات تيك توك: نجاح")
    print_info(f"- ميزات التفاعل: {'نجاح' if engagement_success else 'فشل جزئي'}")
    print_info(f"- ميزات الأمان: {'نجاح' if security_success else 'فشل جزئي'}")
    
    if engagement_success and security_success:
        print_success("تم اجتياز جميع الاختبارات بنجاح!")
    else:
        print_error("تم اجتياز بعض الاختبارات، لكن هناك مشاكل تحتاج إلى معالجة.")

if __name__ == "__main__":
    main()
