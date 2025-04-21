// تكوين التطبيق
const config = {
  // عنوان API - يتم تحديده بناءً على بيئة التشغيل
  apiUrl: process.env.REACT_APP_API_URL || window.location.origin,
  
  // إعدادات المصادقة
  authTokenName: 'token',
  
  // إعدادات التطبيق
  appName: 'أتمتة تيك توك',
  
  // الدول المدعومة
  supportedCountries: ['السعودية', 'الإمارات', 'الكويت', 'مصر'],
  
  // إعدادات التفاعل
  engagement: {
    maxCommentsPerRequest: 10,
    maxLikesPerRequest: 50,
  }
};

export default config;
