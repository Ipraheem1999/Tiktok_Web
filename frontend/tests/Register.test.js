import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Register from '../src/pages/Register';
import { AuthProvider } from '../src/context/AuthContext';

// Mock للـ useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock للـ api
jest.mock('../src/api/api', () => ({
  registerUser: jest.fn(),
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

describe('اختبار صفحة إنشاء حساب جديد', () => {
  test('يجب أن تعرض نموذج إنشاء حساب جديد', () => {
    renderWithProviders(<Register />);
    
    expect(screen.getByText('إنشاء حساب جديد')).toBeInTheDocument();
    expect(screen.getByLabelText('اسم المستخدم')).toBeInTheDocument();
    expect(screen.getByLabelText('البريد الإلكتروني')).toBeInTheDocument();
    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument();
    expect(screen.getByLabelText('تأكيد كلمة المرور')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إنشاء حساب' })).toBeInTheDocument();
    expect(screen.getByText(/لديك حساب بالفعل/i)).toBeInTheDocument();
    expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
  });

  test('يجب أن تظهر رسالة خطأ عند عدم ملء الحقول المطلوبة', async () => {
    renderWithProviders(<Register />);
    
    // النقر على زر إنشاء حساب بدون ملء الحقول
    fireEvent.click(screen.getByRole('button', { name: 'إنشاء حساب' }));
    
    // انتظار ظهور رسالة الخطأ
    await waitFor(() => {
      expect(screen.getByText('يرجى ملء جميع الحقول المطلوبة')).toBeInTheDocument();
    });
  });

  test('يجب أن تظهر رسالة خطأ عند عدم تطابق كلمات المرور', async () => {
    renderWithProviders(<Register />);
    
    // ملء حقول النموذج مع كلمات مرور غير متطابقة
    fireEvent.change(screen.getByLabelText('اسم المستخدم'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('تأكيد كلمة المرور'), {
      target: { value: 'password456' },
    });
    
    // النقر على زر إنشاء حساب
    fireEvent.click(screen.getByRole('button', { name: 'إنشاء حساب' }));
    
    // انتظار ظهور رسالة الخطأ
    await waitFor(() => {
      expect(screen.getByText('كلمات المرور غير متطابقة')).toBeInTheDocument();
    });
  });

  test('يجب أن تقوم بإرسال بيانات إنشاء الحساب عند النقر على الزر', async () => {
    const mockRegisterUser = require('../src/api/api').registerUser;
    mockRegisterUser.mockResolvedValueOnce({ id: 1, username: 'testuser' });
    
    const mockLoginUser = require('../src/api/api').loginUser;
    mockLoginUser.mockResolvedValueOnce({ access_token: 'test_token' });
    
    renderWithProviders(<Register />);
    
    // ملء حقول النموذج
    fireEvent.change(screen.getByLabelText('اسم المستخدم'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('تأكيد كلمة المرور'), {
      target: { value: 'password123' },
    });
    
    // النقر على زر إنشاء حساب
    fireEvent.click(screen.getByRole('button', { name: 'إنشاء حساب' }));
    
    // التحقق من استدعاء وظيفة إنشاء الحساب
    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
