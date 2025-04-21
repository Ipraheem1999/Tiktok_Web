import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Login from '../src/pages/Login';
import { AuthProvider } from '../src/context/AuthContext';

// Mock للـ useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock للـ api
jest.mock('../src/api/api', () => ({
  loginUser: jest.fn(),
  getCurrentUser: jest.fn(),
}));

const renderWithProviders = (ui) => {
  return render(
    <ChakraProvider>
      <BrowserRouter>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  );
};

describe('اختبار صفحة تسجيل الدخول', () => {
  test('يجب أن تعرض نموذج تسجيل الدخول', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
    expect(screen.getByLabelText('اسم المستخدم')).toBeInTheDocument();
    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeInTheDocument();
    expect(screen.getByText(/ليس لديك حساب/i)).toBeInTheDocument();
    expect(screen.getByText('إنشاء حساب جديد')).toBeInTheDocument();
  });

  test('يجب أن تظهر رسالة خطأ عند عدم ملء الحقول المطلوبة', async () => {
    renderWithProviders(<Login />);
    
    // النقر على زر تسجيل الدخول بدون ملء الحقول
    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));
    
    // انتظار ظهور رسالة الخطأ
    await waitFor(() => {
      expect(screen.getByText('يرجى ملء جميع الحقول المطلوبة')).toBeInTheDocument();
    });
  });

  test('يجب أن تقوم بإرسال بيانات تسجيل الدخول عند النقر على الزر', async () => {
    const mockLoginUser = require('../src/api/api').loginUser;
    mockLoginUser.mockResolvedValueOnce({ access_token: 'test_token' });
    
    renderWithProviders(<Login />);
    
    // ملء حقول النموذج
    fireEvent.change(screen.getByLabelText('اسم المستخدم'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), {
      target: { value: 'password123' },
    });
    
    // النقر على زر تسجيل الدخول
    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الدخول' }));
    
    // التحقق من استدعاء وظيفة تسجيل الدخول
    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith('testuser', 'password123');
    });
  });
});
