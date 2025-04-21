import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, Spinner, Center } from '@chakra-ui/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme';

// استخدام التحميل المتأخر للصفحات لتحسين الأداء
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TikTokAccounts = lazy(() => import('./pages/TikTokAccounts'));
const Proxies = lazy(() => import('./pages/Proxies'));
const Schedules = lazy(() => import('./pages/Schedules'));
const Engagement = lazy(() => import('./pages/Engagement'));
const Layout = lazy(() => import('./components/Layout'));

// مكون للتحقق من المصادقة وحماية المسارات
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Suspense fallback={
            <Center h="100vh">
              <Spinner size="xl" color="brand.500" />
            </Center>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="tiktok-accounts" element={<TikTokAccounts />} />
                <Route path="proxies" element={<Proxies />} />
                <Route path="schedules" element={<Schedules />} />
                <Route path="engagement" element={<Engagement />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
