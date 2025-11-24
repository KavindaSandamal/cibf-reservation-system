import { useEmployeeAuth } from '../contexts/EmployeeAuthContext';

/**
 * Hook to check if the current user is an admin
 * Returns true if user has ADMIN role, false otherwise
 */
export const useAdmin = (): boolean => {
  const { employee } = useEmployeeAuth();
  return employee?.role === 'ADMIN';
};

/**
 * Hook to get admin status and employee info
 * Returns object with isAdmin boolean and employee info
 */
export const useAdminInfo = () => {
  const { employee } = useEmployeeAuth();
  return {
    isAdmin: employee?.role === 'ADMIN',
    employee,
  };
};

