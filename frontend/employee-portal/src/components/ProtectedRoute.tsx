import React from 'react';
import { Navigate } from 'react-router-dom';
import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useEmployeeAuth();

  if (!isAuthenticated) {
    return <Navigate to="/employee/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

