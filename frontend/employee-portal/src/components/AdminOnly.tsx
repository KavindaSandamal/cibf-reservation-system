import React from 'react';
import { useAdmin } from '../hooks/useAdmin';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders its children if the current user is an admin
 * Following AdminController.java pattern - Admin only features
 */
const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback = null }) => {
  const isAdmin = useAdmin();

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default AdminOnly;

