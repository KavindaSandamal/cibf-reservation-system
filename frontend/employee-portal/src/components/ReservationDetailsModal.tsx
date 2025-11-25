import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reservation, ReservationStatus } from '../types';

interface ReservationDetailsModalProps {
  reservation: Reservation;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => void;
  onCancel: (id: number) => void;
  onResendEmail?: (id: number) => void;
}

const ReservationDetailsModal: React.FC<ReservationDetailsModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  onResendEmail,
}) => {
  if (!isOpen) return null;

  const statusColors: Record<string, string> = {
    [ReservationStatus.PENDING]: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    [ReservationStatus.CONFIRMED]: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    [ReservationStatus.CANCELLED]: 'bg-red-500/20 text-red-300 border-red-500/30',
    EXPIRED: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-3xl rounded-2xl border-2 border-slate-700/70 bg-slate-900/95 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
              <div>
                <h2 className="text-2xl font-bold text-white">Reservation Details</h2>
                <p className="text-sm text-slate-400">ID: #{reservation.id}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${statusColors[reservation.status] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                  {reservation.status}
                </span>
              </div>

              {/* User Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Business Name</label>
                    <p className="text-white">
                      {reservation.user?.businessName ||
                        reservation.businessName ||
                        reservation.user?.email?.split('@')[0] ||
                        reservation.userEmail?.split('@')[0] ||
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                    <p className="text-white">{reservation.user?.email || reservation.userEmail || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Reservation Date */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Reservation Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Reservation Date</label>
                    <p className="text-white">
                      {reservation.reservationDate 
                        ? new Date(reservation.reservationDate).toLocaleDateString() 
                        : reservation.createdAt 
                        ? new Date(reservation.createdAt).toLocaleDateString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Total Amount</label>
                    <p className="text-white text-xl font-bold">
                      ${reservation.totalAmount != null && reservation.totalAmount !== undefined 
                        ? Number(reservation.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Created At</label>
                    <p className="text-white">
                      {reservation.createdAt 
                        ? new Date(reservation.createdAt).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                  {reservation.confirmedAt && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Confirmed At</label>
                      <p className="text-white">{new Date(reservation.confirmedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {reservation.cancelledAt && (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Cancelled At</label>
                      <p className="text-white">{new Date(reservation.cancelledAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stalls */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Reserved Stalls ({reservation.stalls?.length || 0})
                </h3>
                {reservation.stalls && reservation.stalls.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reservation.stalls.map((stall) => (
                      <div
                        key={stall.id}
                        className="rounded-xl border border-slate-700 bg-slate-800/60 p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white">{stall.stallNumber || stall.stallName || `Stall ${stall.id}`}</span>
                          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                            {stall.size || 'N/A'}
                          </span>
                        </div>
                        {stall.location && (
                          <p className="text-sm text-slate-400 mb-1">{stall.location}</p>
                        )}
                        <p className="text-sm font-semibold text-white">
                          ${stall.price != null && stall.price !== undefined 
                            ? Number(stall.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0.00'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No stalls assigned to this reservation.</p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-slate-700 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800/60 text-white hover:bg-slate-700 transition"
                >
                  Close
                </button>
                {reservation.status === ReservationStatus.PENDING && (
                  <>
                    <button
                      onClick={() => onConfirm(reservation.id)}
                      className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold transition"
                    >
                      Confirm Reservation
                    </button>
                    <button
                      onClick={() => onCancel(reservation.id)}
                      className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-semibold transition"
                    >
                      Cancel Reservation
                    </button>
                  </>
                )}
                {reservation.status === ReservationStatus.CONFIRMED && onResendEmail && (
                  <button
                    onClick={() => onResendEmail(reservation.id)}
                    className="px-4 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold transition"
                  >
                    Resend Confirmation Email
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReservationDetailsModal;