import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { DriversPage } from './pages/DriversPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { HgsPage } from './pages/HgsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ImportsPage } from './pages/ImportsPage';
import { SchedulerPage } from './pages/SchedulerPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { FleetOwnersPage } from './pages/FleetOwnersPage';
import { FleetSelectPage } from './pages/FleetSelectPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
                <Route path="/vehicles" element={<VehiclesPage />} />
                <Route path="/drivers" element={<DriversPage />} />
                <Route path="/settlements" element={<SettlementsPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/hgs" element={<HgsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/imports" element={<ImportsPage />} />
                <Route path="/scheduler" element={<SchedulerPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/fleet-owners" element={<FleetOwnersPage />} />
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
