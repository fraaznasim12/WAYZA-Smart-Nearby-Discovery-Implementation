import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { NewReportPage } from './pages/NewReportPage';
import { MyDisputesPage } from './pages/MyDisputesPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPlacesPage } from './pages/admin/AdminPlacesPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminVerificationsPage } from './pages/admin/AdminVerificationsPage';
import { AdminDisputesPage } from './pages/admin/AdminDisputesPage';
import { AdminBusinessClaimsPage } from './pages/admin/AdminBusinessClaimsPage';
import { AdminDataManagementPage } from './pages/admin/AdminDataManagementPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { BusinessPage } from './pages/BusinessPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotificationSettingsPage } from './pages/NotificationSettingsPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Automatically scrolls to top on route change.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/assistant" element={<AiAssistantPage />} />
          <Route path="/ai-assistant" element={<AiAssistantPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/new"
            element={
              <ProtectedRoute>
                <NewReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MyReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <MyReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-disputes"
            element={
              <ProtectedRoute>
                <MyDisputesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/disputes"
            element={
              <ProtectedRoute>
                <MyDisputesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications/settings"
            element={
              <ProtectedRoute>
                <NotificationSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="places" element={<AdminPlacesPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="verifications" element={<AdminVerificationsPage />} />
            <Route path="disputes" element={<AdminDisputesPage />} />
            <Route path="business-claims" element={<AdminBusinessClaimsPage />} />
            <Route path="data-management" element={<AdminDataManagementPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          <Route
            path="/business"
            element={
              <ProtectedRoute allowedRoles={['ROLE_BUSINESS', 'ROLE_BUSINESS_OWNER', 'ROLE_ADMIN']}>
                <BusinessPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
