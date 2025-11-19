import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import EmployeeWelcomePage from './pages/EmployeeWelcomePage';
import EmployeeLoginPage from './pages/EmployeeLoginPage';
import EmployeeRegisterPage from './pages/EmployeeRegisterPage';

// Placeholder pages - will be implemented
const EmployeeDashboardPage = React.lazy(() => import('./pages/EmployeeDashboardPage'));
const ReservationsManagementPage = React.lazy(() => import('./pages/ReservationsManagementPage'));
const UsersManagementPage = React.lazy(() => import('./pages/UsersManagementPage'));
const StallsOverviewPage = React.lazy(() => import('./pages/StallsOverviewPage'));

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/employee" element={<EmployeeWelcomePage />} />
      <Route path="/employee/login" element={<EmployeeLoginPage />} />
      <Route path="/employee/register" element={<EmployeeRegisterPage />} />
      
      {/* Protected routes */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
                <EmployeeDashboardPage />
              </React.Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/reservations"
        element={
          <ProtectedRoute>
            <Layout>
              <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
                <ReservationsManagementPage />
              </React.Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/users"
        element={
          <ProtectedRoute>
            <Layout>
              <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
                <UsersManagementPage />
              </React.Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/stalls"
        element={
          <ProtectedRoute>
            <Layout>
              <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
                <StallsOverviewPage />
              </React.Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/employee" replace />} />
    </Routes>
  );
};

export default App;

