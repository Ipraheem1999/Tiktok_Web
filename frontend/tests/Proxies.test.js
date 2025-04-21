import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Proxies from '../src/pages/Proxies';
import { AuthProvider } from '../src/context/AuthContext';

// Mock للـ useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock للـ api
jest.mock('../src/api/api', () => ({
  getProxies: jest.fn(),
  createProxy: jest.fn(),
  updateProxy: jest.fn(),
  deleteProxy: jest.fn(),
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

describe('اختبار صفحة إدارة البروكسي', () => {
  beforeEach(() => {
    // إعادة تعيين المحاكاة قبل كل اختبار
    jest.clearAllMocks();
  });

  test('يجب أن تعرض قائمة البروكسيات عند تحميل الصفحة', async () => {
    const mockGetProxies = require('../src/api/api').getProxies;
    mockGetProxies.mockResolvedValueOnce([
      { id: 1, host: '192.168.1.1', port: 8080, country: 'saudi_arabia', is_active: true },
      { id: 2, host: '192.168.1.2', port: 8081, country: 'uae', is_active: false },
    ]);
    
    renderWithProviders(<Proxies />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetProxies).toHaveBeenCalled();
    });
    
    // التحقق من عرض البروكسيات
    expect(screen.getByText('192.168.1.1:8080')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2:8081')).toBeInTheDocument();
    expect(screen.getByText('السعودية')).toBeInTheDocument();
    expect(screen.getByText('الإمارات')).toBeInTheDocument();
  });

  test('يجب أن تفتح نموذج إضافة بروكسي جديد عند النقر على زر الإضافة', async () => {
    const mockGetProxies = require('../src/api/api').getProxies;
    mockGetProxies.mockResolvedValueOnce([]);
    
    renderWithProviders(<Proxies />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetProxies).toHaveBeenCalled();
    });
    
    // النقر على زر إضافة بروكسي جديد
    fireEvent.click(screen.getByText('إضافة بروكسي جديد'));
    
    // التحقق من فتح النموذج
    expect(screen.getByText('إضافة بروكسي جديد', { selector: 'header' })).toBeInTheDocument();
    expect(screen.getByLabelText('المضيف')).toBeInTheDocument();
    expect(screen.getByLabelText('المنفذ')).toBeInTheDocument();
    expect(screen.getByLabelText('الدولة')).toBeInTheDocument();
  });

  test('يجب أن تقوم بإرسال بيانات إضافة بروكسي جديد عند النقر على زر الإضافة', async () => {
    const mockGetProxies = require('../src/api/api').getProxies;
    mockGetProxies.mockResolvedValueOnce([]);
    
    const mockCreateProxy = require('../src/api/api').createProxy;
    mockCreateProxy.mockResolvedValueOnce({ id: 3, host: '192.168.1.3', port: 8082 });
    
    renderWithProviders(<Proxies />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetProxies).toHaveBeenCalled();
    });
    
    // النقر على زر إضافة بروكسي جديد
    fireEvent.click(screen.getByText('إضافة بروكسي جديد'));
    
    // ملء حقول النموذج
    fireEvent.change(screen.getByLabelText('المضيف'), {
      target: { value: '192.168.1.3' },
    });
    fireEvent.change(screen.getByLabelText('المنفذ'), {
      target: { value: '8082' },
    });
    fireEvent.change(screen.getByLabelText('الدولة'), {
      target: { value: 'egypt' },
    });
    
    // النقر على زر الإضافة
    fireEvent.click(screen.getByRole('button', { name: 'إضافة' }));
    
    // التحقق من استدعاء وظيفة إضافة البروكسي
    await waitFor(() => {
      expect(mockCreateProxy).toHaveBeenCalledWith({
        host: '192.168.1.3',
        port: 8082,
        country: 'egypt',
        is_active: true,
      });
    });
  });

  test('يجب أن تقوم بحذف البروكسي عند النقر على زر الحذف', async () => {
    const mockGetProxies = require('../src/api/api').getProxies;
    mockGetProxies.mockResolvedValueOnce([
      { id: 1, host: '192.168.1.1', port: 8080, country: 'saudi_arabia', is_active: true },
    ]);
    
    const mockDeleteProxy = require('../src/api/api').deleteProxy;
    mockDeleteProxy.mockResolvedValueOnce({});
    
    // Mock لـ window.confirm
    window.confirm = jest.fn(() => true);
    
    renderWithProviders(<Proxies />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetProxies).toHaveBeenCalled();
    });
    
    // النقر على زر الحذف
    const deleteButtons = screen.getAllByRole('button', { name: 'حذف' });
    fireEvent.click(deleteButtons[0]);
    
    // التحقق من استدعاء وظيفة حذف البروكسي
    await waitFor(() => {
      expect(mockDeleteProxy).toHaveBeenCalledWith(1);
    });
  });
});
