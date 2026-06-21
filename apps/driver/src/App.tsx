import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { AuthHandoffPage } from './pages/AuthHandoffPage';
import { DashboardPage } from './pages/DashboardPage';
import { EndOfDayPage } from './pages/EndOfDayPage';
import { HistoryPage } from './pages/HistoryPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FleetSelectPage } from './pages/FleetSelectPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/handoff" element={<AuthHandoffPage />} />
      <Route
        path="/select-fleet"
        element={
          <ProtectedRoute>
            <FleetSelectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/end-of-day/:shiftId" element={<EndOfDayPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
