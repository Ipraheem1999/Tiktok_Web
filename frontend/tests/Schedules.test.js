import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Schedules from '../src/pages/Schedules';
import { AuthProvider } from '../src/context/AuthContext';

// Mock للـ useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock للـ api
jest.mock('../src/api/api', () => ({
  getSchedules: jest.fn(),
  getTikTokAccounts: jest.fn(),
  createSchedule: jest.fn(),
  updateSchedule: jest.fn(),
  deleteSchedule: jest.fn(),
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

describe('اختبار صفحة جدولة المنشورات', () => {
  beforeEach(() => {
    // إعادة تعيين المحاكاة قبل كل اختبار
    jest.clearAllMocks();
  });

  test('يجب أن تعرض قائمة المنشورات المجدولة عند تحميل الصفحة', async () => {
    const mockGetSchedules = require('../src/api/api').getSchedules;
    mockGetSchedules.mockResolvedValueOnce([
      { 
        id: 1, 
        account_id: 1, 
        account_username: 'account1', 
        caption: 'منشور تجريبي 1', 
        schedule_time: '2025-04-21T10:00:00', 
        status: 'pending' 
      },
      { 
        id: 2, 
        account_id: 2, 
        account_username: 'account2', 
        caption: 'منشور تجريبي 2', 
        schedule_time: '2025-04-22T15:30:00', 
        status: 'completed' 
      },
    ]);
    
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1' },
      { id: 2, username: 'account2' },
    ]);
    
    renderWithProviders(<Schedules />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetSchedules).toHaveBeenCalled();
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // التحقق من عرض المنشورات المجدولة
    expect(screen.getByText('account1')).toBeInTheDocument();
    expect(screen.getByText('account2')).toBeInTheDocument();
    expect(screen.getByText('منشور تجريبي 1')).toBeInTheDocument();
    expect(screen.getByText('منشور تجريبي 2')).toBeInTheDocument();
    expect(screen.getByText('قيد الانتظار')).toBeInTheDocument();
    expect(screen.getByText('مكتمل')).toBeInTheDocument();
  });

  test('يجب أن تفتح نموذج إضافة منشور جديد عند النقر على زر الإضافة', async () => {
    const mockGetSchedules = require('../src/api/api').getSchedules;
    mockGetSchedules.mockResolvedValueOnce([]);
    
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1' },
    ]);
    
    renderWithProviders(<Schedules />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetSchedules).toHaveBeenCalled();
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // النقر على زر إضافة منشور جديد
    fireEvent.click(screen.getByText('إضافة منشور جديد'));
    
    // التحقق من فتح النموذج
    expect(screen.getByText('إضافة منشور جديد', { selector: 'header' })).toBeInTheDocument();
    expect(screen.getByLabelText('الحساب')).toBeInTheDocument();
    expect(screen.getByLabelText('ملف الفيديو')).toBeInTheDocument();
    expect(screen.getByLabelText('نص المنشور')).toBeInTheDocument();
    expect(screen.getByLabelText('وقت النشر')).toBeInTheDocument();
  });

  test('يجب أن تقوم بإرسال بيانات إضافة منشور جديد عند النقر على زر الإضافة', async () => {
    const mockGetSchedules = require('../src/api/api').getSchedules;
    mockGetSchedules.mockResolvedValueOnce([]);
    
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1' },
    ]);
    
    const mockCreateSchedule = require('../src/api/api').createSchedule;
    mockCreateSchedule.mockResolvedValueOnce({ id: 3 });
    
    renderWithProviders(<Schedules />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetSchedules).toHaveBeenCalled();
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // النقر على زر إضافة منشور جديد
    fireEvent.click(screen.getByText('إضافة منشور جديد'));
    
    // ملء حقول النموذج
    fireEvent.change(screen.getByLabelText('نص المنشور'), {
      target: { value: 'منشور تجريبي جديد' },
    });
    
    // إنشاء ملف وهمي
    const file = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });
    const fileInput = document.getElementById('video-upload');
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    fireEvent.change(fileInput);
    
    fireEvent.change(screen.getByLabelText('وقت النشر'), {
      target: { value: '2025-04-25T12:00' },
    });
    
    fireEvent.change(screen.getByLabelText('الوسوم'), {
      target: { value: '#تيك_توك #اختبار' },
    });
    
    // النقر على زر الإضافة
    fireEvent.click(screen.getByRole('button', { name: 'إضافة' }));
    
    // التحقق من استدعاء وظيفة إضافة المنشور
    await waitFor(() => {
      expect(mockCreateSchedule).toHaveBeenCalledWith(expect.objectContaining({
        account_id: 1,
        caption: 'منشور تجريبي جديد',
        schedule_time: '2025-04-25T12:00',
        tags: '#تيك_توك #اختبار',
        video_file: file,
      }));
    });
  });

  test('يجب أن تقوم بحذف المنشور المجدول عند النقر على زر الحذف', async () => {
    const mockGetSchedules = require('../src/api/api').getSchedules;
    mockGetSchedules.mockResolvedValueOnce([
      { 
        id: 1, 
        account_id: 1, 
        account_username: 'account1', 
        caption: 'منشور تجريبي 1', 
        schedule_time: '2025-04-21T10:00:00', 
        status: 'pending' 
      },
    ]);
    
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1' },
    ]);
    
    const mockDeleteSchedule = require('../src/api/api').deleteSchedule;
    mockDeleteSchedule.mockResolvedValueOnce({});
    
    // Mock لـ window.confirm
    window.confirm = jest.fn(() => true);
    
    renderWithProviders(<Schedules />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetSchedules).toHaveBeenCalled();
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // النقر على زر الحذف
    const deleteButtons = screen.getAllByRole('button', { name: 'حذف' });
    fireEvent.click(deleteButtons[0]);
    
    // التحقق من استدعاء وظيفة حذف المنشور
    await waitFor(() => {
      expect(mockDeleteSchedule).toHaveBeenCalledWith(1);
    });
  });
});
