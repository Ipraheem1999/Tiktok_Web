import axios from 'axios';
import config from '../config';

const API_URL = config.apiUrl;

// إعداد الإنترسبتور لإضافة التوكن إلى رؤوس الطلبات
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// إضافة إنترسبتور للاستجابة لمعالجة الأخطاء بشكل موحد
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // معالجة أخطاء المصادقة
    if (error.response && error.response.status === 401) {
      // إزالة التوكن وإعادة توجيه المستخدم إلى صفحة تسجيل الدخول
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// وظائف المصادقة
export const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/token`, new URLSearchParams({
      username,
      password,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    throw error;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users/`, userData);
    return response.data;
  } catch (error) {
    console.error('خطأ في إنشاء حساب جديد:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/me/`);
    return response.data;
  } catch (error) {
    console.error('خطأ في الحصول على بيانات المستخدم الحالي:', error);
    throw error;
  }
};

// وظائف إدارة حسابات تيك توك
export const getTikTokAccounts = async () => {
  try {
    const response = await axios.get(`${API_URL}/tiktok-accounts/`);
    return response.data;
  } catch (error) {
    console.error('خطأ في الحصول على حسابات تيك توك:', error);
    throw error;
  }
};

export const getTikTokAccount = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/tiktok-accounts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`خطأ في الحصول على حساب تيك توك رقم ${id}:`, error);
    throw error;
  }
};

export const createTikTokAccount = async (accountData) => {
  try {
    const response = await axios.post(`${API_URL}/tiktok-accounts/`, accountData);
    return response.data;
  } catch (error) {
    console.error('خطأ في إنشاء حساب تيك توك جديد:', error);
    throw error;
  }
};

export const updateTikTokAccount = async (id, accountData) => {
  try {
    const response = await axios.put(`${API_URL}/tiktok-accounts/${id}`, accountData);
    return response.data;
  } catch (error) {
    console.error(`خطأ في تحديث حساب تيك توك رقم ${id}:`, error);
    throw error;
  }
};

export const deleteTikTokAccount = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/tiktok-accounts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`خطأ في حذف حساب تيك توك رقم ${id}:`, error);
    throw error;
  }
};

// وظائف إدارة البروكسي
export const getProxies = async () => {
  try {
    const response = await axios.get(`${API_URL}/proxies/`);
    return response.data;
  } catch (error) {
    console.error('خطأ في الحصول على قائمة البروكسيات:', error);
    throw error;
  }
};

export const createProxy = async (proxyData) => {
  try {
    const response = await axios.post(`${API_URL}/proxies/`, proxyData);
    return response.data;
  } catch (error) {
    console.error('خطأ في إنشاء بروكسي جديد:', error);
    throw error;
  }
};

export const deleteProxy = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/proxies/${id}`);
    return response.data;
  } catch (error) {
    console.error(`خطأ في حذف البروكسي رقم ${id}:`, error);
    throw error;
  }
};

// وظائف جدولة المنشورات
export const getSchedules = async () => {
  try {
    const response = await axios.get(`${API_URL}/schedules/`);
    return response.data;
  } catch (error) {
    console.error('خطأ في الحصول على قائمة الجدولة:', error);
    throw error;
  }
};

export const getSchedule = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/schedules/${id}`);
    return response.data;
  } catch (error) {
    console.error(`خطأ في الحصول على الجدولة رقم ${id}:`, error);
    throw error;
  }
};

export const createSchedule = async (scheduleData) => {
  try {
    // استخدام FormData لإرسال الملفات
    const formData = new FormData();
    formData.append('caption', scheduleData.caption);
    formData.append('schedule_time', scheduleData.schedule_time);
    formData.append('account_id', scheduleData.account_id);
    
    if (scheduleData.tags) {
      formData.append('tags', scheduleData.tags);
    }
    
    if (scheduleData.video_file) {
      formData.append('video', scheduleData.video_file);
    }
    
    const response = await axios.post(`${API_URL}/schedules/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('خطأ في إنشاء جدولة جديدة:', error);
    throw error;
  }
};

export const deleteSchedule = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/schedules/${id}`);
    return response.data;
  } catch (error) {
    console.error(`خطأ في حذف الجدولة رقم ${id}:`, error);
    throw error;
  }
};

// وظائف التفاعل - تصحيح المسارات لتتوافق مع الخادم الخلفي
export const likeVideo = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/engagements/like/`, data);
    return response.data;
  } catch (error) {
    console.error('خطأ في الإعجاب بالفيديو:', error);
    throw error;
  }
};

export const commentVideo = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/engagements/comment/`, data);
    return response.data;
  } catch (error) {
    console.error('خطأ في التعليق على الفيديو:', error);
    throw error;
  }
};

export const shareVideo = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/engagements/share/`, data);
    return response.data;
  } catch (error) {
    console.error('خطأ في مشاركة الفيديو:', error);
    throw error;
  }
};

export const saveVideo = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/engagements/save/`, data);
    return response.data;
  } catch (error) {
    console.error('خطأ في حفظ الفيديو:', error);
    throw error;
  }
};

export const followUser = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/engagements/follow/`, data);
    return response.data;
  } catch (error) {
    console.error('خطأ في متابعة المستخدم:', error);
    throw error;
  }
};

// إضافة وظيفة للحصول على قائمة التفاعلات
export const getEngagements = async () => {
  try {
    const response = await axios.get(`${API_URL}/engagements/`);
    return response.data;
  } catch (error) {
    console.error('خطأ في الحصول على قائمة التفاعلات:', error);
    throw error;
  }
};

export default {
  loginUser,
  registerUser,
  getCurrentUser,
  getTikTokAccounts,
  getTikTokAccount,
  createTikTokAccount,
  updateTikTokAccount,
  deleteTikTokAccount,
  getProxies,
  createProxy,
  deleteProxy,
  getSchedules,
  getSchedule,
  createSchedule,
  deleteSchedule,
  likeVideo,
  commentVideo,
  shareVideo,
  saveVideo,
  followUser,
  getEngagements,
};
