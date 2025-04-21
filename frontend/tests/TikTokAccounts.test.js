import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import TikTokAccounts from '../src/pages/TikTokAccounts';
import { AuthProvider } from '../src/context/AuthContext';

// Mock للـ useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock للـ api
jest.mock('../src/api/api', () => ({
  getTikTokAccounts: jest.fn(),
  createTikTokAccount: jest.fn(),
  updateTikTokAccount: jest.fn(),
  deleteTikTokAccount: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// Mock للـ useAuth
jest.mock('../src/context/AuthContext', () => ({
  ...jest.requireActual('../src/context/AuthContext'),
  useAuth: () => ({
    user: { id: 1, username: 'testuser' },
    loading: false,
  }),
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

describe('اختبار صفحة إدارة حسابات تيك توك', () => {
  beforeEach(() => {
    // إعادة تعيين المحاكاة قبل كل اختبار
    jest.clearAllMocks();
  });

  test('يجب أن تعرض قائمة الحسابات عند تحميل الصفحة', async () => {
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1', country: 'saudi_arabia', proxy: null },
      { id: 2, username: 'account2', country: 'uae', proxy: '192.168.1.1:8080' },
    ]);
    
    renderWithProviders(<TikTokAccounts />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // التحقق من عرض الحسابات
    expect(screen.getByText('account1')).toBeInTheDocument();
    expect(screen.getByText('account2')).toBeInTheDocument();
    expect(screen.getByText('السعودية')).toBeInTheDocument();
    expect(screen.getByText('الإمارات')).toBeInTheDocument();
  });

  test('يجب أن تفتح نموذج إضافة حساب جديد عند النقر على زر الإضافة', async () => {
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([]);
    
    renderWithProviders(<TikTokAccounts />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // النقر على زر إضافة حساب جديد
    fireEvent.click(screen.getByText('إضافة حساب جديد'));
    
    // التحقق من فتح النموذج
    expect(screen.getByText('إضافة حساب جديد', { selector: 'header' })).toBeInTheDocument();
    expect(screen.getByLabelText('اسم المستخدم')).toBeInTheDocument();
    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument();
    expect(screen.getByLabelText('الدولة')).toBeInTheDocument();
  });

  test('يجب أن تقوم بإرسال بيانات إضافة حساب جديد عند النقر على زر الإضافة', async () => {
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([]);
    
    const mockCreateTikTokAccount = require('../src/api/api').createTikTokAccount;
    mockCreateTikTokAccount.mockResolvedValueOnce({ id: 3, username: 'newaccount' });
    
    renderWithProviders(<TikTokAccounts />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // النقر على زر إضافة حساب جديد
    fireEvent.click(screen.getByText('إضافة حساب جديد'));
    
    // ملء حقول النموذج
    fireEvent.change(screen.getByLabelText('اسم المستخدم'), {
      target: { value: 'newaccount' },
    });
    fireEvent.change(screen.getByLabelText('كلمة المرور'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('الدولة'), {
      target: { value: 'egypt' },
    });
    
    // النقر على زر الإضافة
    fireEvent.click(screen.getByRole('button', { name: 'إضافة' }));
    
    // التحقق من استدعاء وظيفة إضافة الحساب
    await waitFor(() => {
      expect(mockCreateTikTokAccount).toHaveBeenCalledWith({
        username: 'newaccount',
        password: 'password123',
        country: 'egypt',
        proxy: null,
      });
    });
  });

  test('يجب أن تقوم بحذف الحساب عند النقر على زر الحذف', async () => {
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1', country: 'saudi_arabia', proxy: null },
    ]);
    
    const mockDeleteTikTokAccount = require('../src/api/api').deleteTikTokAccount;
    mockDeleteTikTokAccount.mockResolvedValueOnce({});
    
    // Mock لـ window.confirm
    window.confirm = jest.fn(() => true);
    
    renderWithProviders(<TikTokAccounts />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // النقر على زر الحذف
    const deleteButtons = screen.getAllByRole('button', { name: 'حذف' });
    fireEvent.click(deleteButtons[0]);
    
    // التحقق من استدعاء وظيفة حذف الحساب
    await waitFor(() => {
      expect(mockDeleteTikTokAccount).toHaveBeenCalledWith(1);
    });
  });
});
