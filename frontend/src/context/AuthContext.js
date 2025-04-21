import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // التحقق من وجود توكن في التخزين المحلي
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const userData = await api.getCurrentUser();
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error);
      logout();
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.loginUser(username, password);
      
      // حفظ التوكن في التخزين المحلي
      localStorage.setItem('token', data.access_token);
      
      // جلب بيانات المستخدم
      await fetchCurrentUser();
      
      // التوجيه إلى لوحة التحكم
      navigate('/dashboard');
      
      return true;
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      setError(error.response?.data?.detail || 'حدث خطأ أثناء تسجيل الدخول');
      setLoading(false);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      await api.registerUser(userData);
      
      // تسجيل الدخول تلقائياً بعد التسجيل
      return await login(userData.username, userData.password);
    } catch (error) {
      console.error('خطأ في إنشاء الحساب:', error);
      setError(error.response?.data?.detail || 'حدث خطأ أثناء إنشاء الحساب');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    // حذف التوكن من التخزين المحلي
    localStorage.removeItem('token');
    setUser(null);
    
    // التوجيه إلى صفحة تسجيل الدخول
    navigate('/login');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth يجب استخدامه داخل AuthProvider');
  }
  return context;
};

export default AuthContext;
