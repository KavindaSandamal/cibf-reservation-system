import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userService } from '../services/userService';
import { User } from '../types';
import { toast } from 'react-toastify';
import UserDetailModal from '../components/UserDetailModal';
import CreateUserModal from '../components/CreateUserModal';
import CreateStaffModal from '../components/CreateStaffModal';
import { useAdmin } from '../hooks/useAdmin';
import { reservationService } from '../services/reservationService';

const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateEmployeeModalOpen, setIsCreateEmployeeModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [reservationCounts, setReservationCounts] = useState<Record<number, number>>({});
  const isAdmin = useAdmin();

  const updateReservationCounts = async (usersList: User[]) => {
    const missingIds = usersList
      .map((user) => user.id)
      .filter((id) => reservationCounts[id] === undefined);

    if (missingIds.length === 0) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        missingIds.map(async (userId) => {
          const reservations = await reservationService.getReservationsByUserId(userId);
          return { userId, count: reservations.length };
        })
      );

      setReservationCounts((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            next[result.value.userId] = result.value.count;
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Error fetching reservation counts:', error);
    }
  };

  // Filter function to determine if a user should be visible to the current user
  const shouldShowUser = (user: User): boolean => {
    if (isAdmin) return true; // Admins see all users
    
    const userRole = user.role?.toUpperCase();
    
    // If role is explicitly VENDOR, show it
    if (userRole === 'VENDOR') return true;
    
    // If role is EMPLOYEE or ADMIN, hide it
    if (userRole === 'EMPLOYEE' || userRole === 'ADMIN') return false;
    
    // If role is not set, check businessName pattern (fallback for backward compatibility)
    if (!userRole && user.businessName) {
      const businessName = user.businessName.toLowerCase();
      if (businessName.includes('cibf employee') || businessName.includes('cibf admin')) {
        return false; // Hide employees/admins
      }
    }
    
    // Also check email pattern - employees often have @cibf.com emails
    if (!userRole && user.email) {
      const email = user.email.toLowerCase();
      if (email.includes('@cibf.com') || email.includes('emp_')) {
        return false; // Hide employees/admins
      }
    }
    
    // If no role and doesn't match employee pattern, assume it's a vendor
    return true;
  };

  // Load users with appropriate pagination strategy
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      if (!isAdmin) {
        // For employees: Fetch all users, filter client-side, then paginate client-side
        // This ensures accurate counts and pagination
        const allUsers: User[] = [];
        let currentBackendPage = 0;
        let hasMorePages = true;
        const pageSize = 100; // Fetch in larger batches
        
        // Fetch all pages until we have all users
        while (hasMorePages) {
          const result = await userService.getAllUsers({
            search: searchQuery.trim() || undefined,
            page: currentBackendPage,
            size: pageSize,
          });
          
          allUsers.push(...result.users);
          
          if (result.pagination) {
            hasMorePages = currentBackendPage + 1 < result.pagination.totalPages;
            currentBackendPage++;
          } else {
            hasMorePages = false;
          }
        }
        
        // Filter users based on role
        const filteredUsers = allUsers.filter(shouldShowUser);
        
        // Apply client-side pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        setUsers(paginatedUsers);
        updateReservationCounts(paginatedUsers);
        
        // Set correct pagination info based on filtered results
        setTotalItems(filteredUsers.length);
        setTotalPages(Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage)));
      } else {
        // For admins: Use server-side pagination (more efficient)
        const backendPage = currentPage - 1; // Convert to 0-based for backend
        const result = await userService.getAllUsers({
          search: searchQuery.trim() || undefined,
          page: backendPage,
          size: itemsPerPage,
        });
        
        setUsers(result.users);
        updateReservationCounts(result.users);
        
        // Use backend pagination info
        if (result.pagination) {
          setTotalItems(result.pagination.totalItems);
          setTotalPages(result.pagination.totalPages);
          
          // Sync current page if backend returned different page (convert back to 1-based)
          if (result.pagination.currentPage + 1 !== currentPage) {
            setCurrentPage(result.pagination.currentPage + 1);
          }
        } else {
          setTotalItems(result.users.length);
          setTotalPages(result.users.length > 0 ? 1 : 0);
        }
      }
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load users when dependencies change
  useEffect(() => {
    // Debounce search queries
    const timer = setTimeout(() => {
      loadUsers();
    }, searchQuery.trim().length > 0 ? 500 : 0);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, itemsPerPage, isAdmin]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Admin-only: Delete user
  const handleDeleteUser = async (userId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    if (!isAdmin) {
      toast.error('Access denied. Admin role required.');
      return;
    }

    // Check if this is an employee account (email contains @cibf.com or business name suggests employee)
    const user = users.find(u => u.id === userId);
    const isEmployeeAccount = user?.email?.includes('@cibf.com') || 
                              user?.email?.toLowerCase().includes('emp_') ||
                              user?.businessName?.toLowerCase().includes('employee') ||
                              user?.businessName?.toLowerCase().includes('cibf employee');

    if (!window.confirm(`Are you sure you want to delete ${isEmployeeAccount ? 'employee' : 'user'} #${userId}? This action cannot be undone.`)) {
      return;
    }

    try {
      // If it's clearly an employee account, use employee deletion endpoint directly
      if (isEmployeeAccount) {
        const { employeeService } = await import('../services/employeeService');
        await employeeService.deleteEmployee(userId);
        toast.success('Employee deleted successfully');
        loadUsers(); // Reload users list
        return;
      }

      // Try to delete as regular user first
      await userService.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers(); // Reload users list
    } catch (error: any) {
      // If error suggests it's an employee, try employee deletion endpoint
      if (error.message?.includes('employee') || error.message?.includes('Employee') || 
          error.response?.data?.message?.includes('employee') || 
          error.response?.data?.message?.includes('Employee')) {
        try {
          const { employeeService } = await import('../services/employeeService');
          await employeeService.deleteEmployee(userId);
          toast.success('Employee deleted successfully');
          loadUsers(); // Reload users list
        } catch (employeeError: any) {
          const errorMessage = employeeError.message || 
                              employeeError.response?.data?.message || 
                              employeeError.response?.data?.error || 
                              'Failed to delete employee';
          toast.error(errorMessage);
          console.error('Error deleting employee:', employeeError);
        }
      } else {
        // Show the actual error message from backend
        const errorMessage = error.message || 
                           error.response?.data?.message || 
                           error.response?.data?.error || 
                           'Failed to delete user. Please check if user has active reservations or database constraints.';
        toast.error(errorMessage);
        console.error('Error deleting user:', {
          error,
          response: error.response?.data,
          status: error.response?.status
        });
      }
    }
  };

  // Admin-only: Bulk delete users
  const handleBulkDelete = async () => {
    if (!isAdmin) {
      toast.error('Access denied. Admin role required.');
      return;
    }

    if (selectedUserIds.size === 0) {
      toast.warn('Please select at least one user to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedUserIds.size} user(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const userIds = Array.from(selectedUserIds);
      const result = await userService.bulkDeleteUsers(userIds);
      toast.success(`Successfully deleted ${result.deleted} user(s)`);
      if (result.failed > 0) {
        toast.warn(`${result.failed} user(s) could not be deleted`);
      }
      setSelectedUserIds(new Set());
      loadUsers(); // Reload users list
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete users');
      console.error('Error bulk deleting users:', error);
    }
  };

  // Toggle user selection for bulk operations
  const handleToggleUserSelection = (userId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    if (!isAdmin) return;

    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleSelectAll = () => {
    if (!isAdmin) return;
    if (selectedUserIds.size === paginatedUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  // For employees, users are already paginated client-side
  // For admins, users come from server-side pagination
  const getDisplayName = (user: User): string => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    if (name.length > 0) {
      return name;
    }
    if (user.businessName && user.businessName.trim().length > 0) {
      return user.businessName.trim();
    }
    if (user.email) {
      const emailPrefix = user.email.split('@')[0];
      if (emailPrefix.length > 0) {
        return emailPrefix;
      }
    }
    return `User #${user.id}`;
  };

  const paginatedUsers = users;
  const pageCount = Math.max(1, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = isAdmin 
    ? Math.min(startIndex + paginatedUsers.length, totalItems)
    : Math.min(startIndex + paginatedUsers.length, totalItems);

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-300">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/4 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.800)_1px,transparent_1px)] [background-size:18px_18px] opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                Users Management
              </h1>
              <p className="text-slate-400">View and manage all registered users</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Add New User button - admin only */}
              {isAdmin && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add New User
                </button>
              )}

              {/* CreateStaffModal buttons */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => setIsEmployeeModalOpen(true)}
                    className="px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                    Create Employee
                  </button>
                  <button
                    onClick={() => setIsAdminModalOpen(true)}
                    className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                    Create Admin
                  </button>
                </>
              )}
              
              {/* Delete Selected button - admin only */}
              {isAdmin && selectedUserIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-lg transition"
                >
                  Delete Selected ({selectedUserIds.size})
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl border-2 border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl"
        >
          <label className="block text-sm font-medium text-slate-300 mb-2">Search Users</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or business name..."
            className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border-2 border-slate-700/70 bg-slate-900/80 shadow-2xl backdrop-blur-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/60 border-b border-slate-700">
                <tr>
                  {isAdmin && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.size === paginatedUsers.length && paginatedUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Reservations</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Joined Date</th>
                  {isAdmin && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 6} className="px-6 py-12 text-center text-slate-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-800/40 transition-colors ${isAdmin ? '' : 'cursor-pointer'}`}
                      onClick={() => !isAdmin && handleViewUser(user)}
                    >
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => handleToggleUserSelection(user.id, e)}>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => {}} // Handled by onClick on td
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-white">#{user.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-white">
                          {getDisplayName(user)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-300">{user.email}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-300">
                          {user.businessName || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">
                          {reservationCounts[user.id] ?? user.reservationCount ?? '…'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-300">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewUser(user);
                              }}
                              className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition"
                            >
                              View
                            </button>
                            <button
                              onClick={(e) => handleDeleteUser(user.id, e)}
                              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Showing {totalItems > 0 ? startIndex + 1 : 0} to {endIndex} of {totalItems} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-300">
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(pageCount)}
                  disabled={currentPage >= pageCount}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadUsers(); // Reload users list after successful creation
        }}
      />

      <CreateStaffModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSuccess={() => {
          loadUsers();
        }}
        mode="employee"
      />

      {/* Admin Modal */}
      <CreateStaffModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => {
          loadUsers();
        }}
        mode="admin"
      />
    </div>
  );
};

export default UsersManagementPage;