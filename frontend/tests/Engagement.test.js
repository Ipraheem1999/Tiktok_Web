import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Engagement from '../src/pages/Engagement';
import { AuthProvider } from '../src/context/AuthContext';

// Mock للـ useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock للـ api
jest.mock('../src/api/api', () => ({
  getTikTokAccounts: jest.fn(),
  likeVideo: jest.fn(),
  commentVideo: jest.fn(),
  shareVideo: jest.fn(),
  saveVideo: jest.fn(),
  followUser: jest.fn(),
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

describe('اختبار صفحة التفاعل', () => {
  beforeEach(() => {
    // إعادة تعيين المحاكاة قبل كل اختبار
    jest.clearAllMocks();
  });

  test('يجب أن تعرض علامات التبويب الخمسة للتفاعل عند تحميل الصفحة', async () => {
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1' },
      { id: 2, username: 'account2' },
    ]);
    
    renderWithProviders(<Engagement />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // التحقق من عرض علامات التبويب
    expect(screen.getByText('الإعجاب')).toBeInTheDocument();
    expect(screen.getByText('التعليق')).toBeInTheDocument();
    expect(screen.getByText('المشاركة')).toBeInTheDocument();
    expect(screen.getByText('الحفظ')).toBeInTheDocument();
    expect(screen.getByText('المتابعة')).toBeInTheDocument();
  });

  test('يجب أن تقوم بإرسال طلب الإعجاب بالفيديو عند النقر على زر الإعجاب', async () => {
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1' },
    ]);
    
    const mockLikeVideo = require('../src/api/api').likeVideo;
    mockLikeVideo.mockResolvedValueOnce({});
    
    renderWithProviders(<Engagement />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // ملء حقول نموذج الإعجاب
    fireEvent.change(screen.getByLabelText('رابط الفيديو'), {
      target: { value: 'https://www.tiktok.com/@user/video/123456789' },
    });
    
    // النقر على زر الإعجاب
    fireEvent.click(screen.getByRole('button', { name: 'الإعجاب بالفيديو' }));
    
    // التحقق من استدعاء وظيفة الإعجاب
    await waitFor(() => {
      expect(mockLikeVideo).toHaveBeenCalledWith({
        account_id: 1,
        video_url: 'https://www.tiktok.com/@user/video/123456789',
      });
    });
  });

  test('يجب أن تقوم بإرسال طلب التعليق على الفيديو عند النقر على زر التعليق', async () => {
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1' },
    ]);
    
    const mockCommentVideo = require('../src/api/api').commentVideo;
    mockCommentVideo.mockResolvedValueOnce({});
    
    renderWithProviders(<Engagement />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // الانتقال إلى علامة تبويب التعليق
    fireEvent.click(screen.getByText('التعليق'));
    
    // ملء حقول نموذج التعليق
    fireEvent.change(screen.getAllByLabelText('رابط الفيديو')[1], {
      target: { value: 'https://www.tiktok.com/@user/video/123456789' },
    });
    fireEvent.change(screen.getByLabelText('نص التعليق'), {
      target: { value: 'تعليق تجريبي' },
    });
    
    // النقر على زر التعليق
    fireEvent.click(screen.getByRole('button', { name: 'إضافة تعليق' }));
    
    // التحقق من استدعاء وظيفة التعليق
    await waitFor(() => {
      expect(mockCommentVideo).toHaveBeenCalledWith({
        account_id: 1,
        video_url: 'https://www.tiktok.com/@user/video/123456789',
        comment_text: 'تعليق تجريبي',
      });
    });
  });

  test('يجب أن تقوم بإرسال طلب مشاركة الفيديو عند النقر على زر المشاركة', async () => {
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1' },
    ]);
    
    const mockShareVideo = require('../src/api/api').shareVideo;
    mockShareVideo.mockResolvedValueOnce({});
    
    renderWithProviders(<Engagement />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // الانتقال إلى علامة تبويب المشاركة
    fireEvent.click(screen.getByText('المشاركة'));
    
    // ملء حقول نموذج المشاركة
    fireEvent.change(screen.getAllByLabelText('رابط الفيديو')[2], {
      target: { value: 'https://www.tiktok.com/@user/video/123456789' },
    });
    fireEvent.change(screen.getByLabelText('نوع المشاركة'), {
      target: { value: 'whatsapp' },
    });
    
    // النقر على زر المشاركة
    fireEvent.click(screen.getByRole('button', { name: 'مشاركة الفيديو' }));
    
    // التحقق من استدعاء وظيفة المشاركة
    await waitFor(() => {
      expect(mockShareVideo).toHaveBeenCalledWith({
        account_id: 1,
        video_url: 'https://www.tiktok.com/@user/video/123456789',
        share_type: 'whatsapp',
      });
    });
  });

  test('يجب أن تقوم بإرسال طلب متابعة المستخدم عند النقر على زر المتابعة', async () => {
    const mockGetTikTokAccounts = require('../src/api/api').getTikTokAccounts;
    mockGetTikTokAccounts.mockResolvedValueOnce([
      { id: 1, username: 'account1' },
    ]);
    
    const mockFollowUser = require('../src/api/api').followUser;
    mockFollowUser.mockResolvedValueOnce({});
    
    renderWithProviders(<Engagement />);
    
    // انتظار تحميل البيانات
    await waitFor(() => {
      expect(mockGetTikTokAccounts).toHaveBeenCalled();
    });
    
    // الانتقال إلى علامة تبويب المتابعة
    fireEvent.click(screen.getByText('المتابعة'));
    
    // ملء حقول نموذج المتابعة
    fireEvent.change(screen.getByLabelText('اسم المستخدم المراد متابعته'), {
      target: { value: 'targetuser' },
    });
    
    // النقر على زر المتابعة
    fireEvent.click(screen.getByRole('button', { name: 'متابعة المستخدم' }));
    
    // التحقق من استدعاء وظيفة المتابعة
    await waitFor(() => {
      expect(mockFollowUser).toHaveBeenCalledWith({
        account_id: 1,
        username: 'targetuser',
      });
    });
  });
});
