import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { reservationService } from '../services/reservationService';
import { Reservation, ReservationStatus } from '../types';
import { toast } from 'react-toastify';
import ReservationDetailsModal from '../components/ReservationDetailsModal';

const ReservationsManagementPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSearchQueryRef = useRef<string>(searchQuery);

  // Load reservations with debounced search
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await reservationService.getAllReservations({
          status: statusFilter,
          search: searchQuery.trim() || undefined, // Trim whitespace and send only if not empty
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: currentPage,
          size: itemsPerPage,
        });
        setReservations(result.reservations);
        // Update pagination info from backend
        if (result.pagination) {
          setTotalItems(result.pagination.totalItems);
          setTotalPages(result.pagination.totalPages);
          // Sync current page if backend returned different page
          if (result.pagination.currentPage !== currentPage) {
            setCurrentPage(result.pagination.currentPage);
          }
        } else {
          // No pagination info (fallback to array length)
          setTotalItems(result.reservations.length);
          setTotalPages(result.reservations.length > 0 ? 1 : 0);
        }
      } catch (error: any) {
        const errorMessage = error.response?.status === 403 
          ? 'Access denied. Please ensure you are logged in with an employee account.'
          : error.response?.status === 401
          ? 'Session expired. Please log in again.'
          : 'Failed to load reservations';
        toast.error(errorMessage);
        console.error('Error loading reservations:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error('Auth error details:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Check if search query changed
    const searchChanged = prevSearchQueryRef.current !== searchQuery;
    prevSearchQueryRef.current = searchQuery;
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // If search changed and has value, debounce it; otherwise load immediately
    if (searchChanged && searchQuery.trim().length > 0) {
      // Debounce search queries (500ms)
      searchTimeoutRef.current = setTimeout(() => {
        loadData();
        searchTimeoutRef.current = null;
      }, 500);
    } else {
      // Immediate load for other filters or empty search
      loadData();
    }
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [currentPage, statusFilter, startDate, endDate, itemsPerPage, searchQuery]);

  // Reset to first page when filters change (except search which is handled separately)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter, startDate, endDate]);

  const reloadReservations = async () => {
    try {
      setLoading(true);
      const result = await reservationService.getAllReservations({
        status: statusFilter,
        search: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        size: itemsPerPage,
      });
      setReservations(result.reservations);
      if (result.pagination) {
        setTotalItems(result.pagination.totalItems);
        setTotalPages(result.pagination.totalPages);
        if (result.pagination.currentPage !== currentPage) {
          setCurrentPage(result.pagination.currentPage);
        }
      } else {
        setTotalItems(result.reservations.length);
        setTotalPages(result.reservations.length > 0 ? 1 : 0);
      }
    } catch (error: any) {
      toast.error('Failed to reload reservations');
      console.error('Error reloading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async (id: number) => {
    try {
      await reservationService.confirmReservation(id);
      toast.success('Reservation confirmed successfully');
      if (selectedReservation?.id === id) {
        setSelectedReservation({ ...selectedReservation, status: ReservationStatus.CONFIRMED });
      }
      await reloadReservations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm reservation');
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    try {
      await reservationService.cancelReservation(id);
      toast.success('Reservation cancelled successfully');
      if (selectedReservation?.id === id) {
        setSelectedReservation({ ...selectedReservation, status: ReservationStatus.CANCELLED });
      }
      await reloadReservations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel reservation');
    }
  };

  const handleResendEmail = async (id: number) => {
    try {
      await reservationService.resendConfirmationEmail(id);
      toast.success('Confirmation email sent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email');
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  // Use server-side pagination - reservations are already paginated from backend
  // Don't slice the array, use it as-is
  const paginatedReservations = reservations;

  const statusColors = {
    [ReservationStatus.PENDING]: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    [ReservationStatus.CONFIRMED]: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    [ReservationStatus.CANCELLED]: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-300">Loading reservations...</p>
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
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Reservations Management
          </h1>
          <p className="text-slate-400">Manage all reservations and confirmations</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl border-2 border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, email, or business name..."
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | 'ALL')}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value={ReservationStatus.PENDING}>Pending</option>
                <option value={ReservationStatus.CONFIRMED}>Confirmed</option>
                <option value={ReservationStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>
          
          {/* Clear Filters Button */}
          {(statusFilter !== 'ALL' || searchQuery || startDate || endDate) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-white text-sm font-medium transition"
              >
                Clear Filters
              </button>
            </div>
          )}
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Stalls</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {paginatedReservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No reservations found
                    </td>
                  </tr>
                ) : (
                  paginatedReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-white">#{reservation.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-white">
                            {reservation.user?.businessName ||
                              (reservation.user?.email
                                ? reservation.user.email.split('@')[0]
                                : reservation.user?.firstName || reservation.user?.lastName
                                ? `${reservation.user?.firstName ?? ''} ${reservation.user?.lastName ?? ''}`.trim()
                                : reservation.userId
                                ? `User #${reservation.userId}`
                                : 'Unknown')}
                          </div>
                          <div className="text-sm text-slate-400">
                            {reservation.user?.email || reservation.user?.businessName || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {reservation.stalls.slice(0, 2).map((stall) => (
                            <span key={stall.id} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                              {stall.stallNumber}
                            </span>
                          ))}
                          {reservation.stalls.length > 2 && (
                            <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                              +{reservation.stalls.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-300">
                          {reservation.reservationDate 
                            ? new Date(reservation.reservationDate).toLocaleDateString() 
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-white">
                          ${reservation.totalAmount != null 
                            ? reservation.totalAmount.toLocaleString() 
                            : '0.00'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[reservation.status]}`}>
                          {reservation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(reservation)}
                            className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition"
                          >
                            View
                          </button>
                          {reservation.status === ReservationStatus.PENDING && (
                            <>
                              <button
                                onClick={() => handleConfirmReservation(reservation.id)}
                                className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleCancelReservation(reservation.id)}
                                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {reservation.status === ReservationStatus.CONFIRMED && (
                            <button
                              onClick={() => handleResendEmail(reservation.id)}
                              className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition"
                              title="Resend confirmation email"
                            >
                              Resend Email
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} reservations
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
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reservation Details Modal */}
      {selectedReservation && (
        <ReservationDetailsModal
          reservation={selectedReservation}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmReservation}
          onCancel={handleCancelReservation}
          onResendEmail={handleResendEmail}
        />
      )}
    </div>
  );
};

export default ReservationsManagementPage;