import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stall, StallSize } from '../types';
import { stallService } from '../services/stallService';
import { toast } from 'react-toastify';

interface StallDetailModalProps {
  stall: Stall;
  isOpen: boolean;
  onClose: () => void;
}

const StallDetailModal: React.FC<StallDetailModalProps> = ({
  stall,
  isOpen,
  onClose,
}) => {
  const [reservationInfo, setReservationInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && stall && !stall.isAvailable) {
      loadReservationInfo();
    } else {
      setLoading(false);
    }
  }, [isOpen, stall]);

  const loadReservationInfo = async () => {
    try {
      setLoading(true);
      const info = await stallService.getStallReservation(stall.id);
      setReservationInfo(info);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.warn('Reservation info not available');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sizeColors = {
    [StallSize.SMALL]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    [StallSize.MEDIUM]: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    [StallSize.LARGE]: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
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
                <h2 className="text-2xl font-bold text-white">Stall Details</h2>
                <p className="text-sm text-slate-400">{stall.stallNumber}</p>
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
              {/* Stall Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Stall Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Stall Number</label>
                    <p className="text-white font-semibold">{stall.stallNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Stall Name</label>
                    <p className="text-white">{stall.stallName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                    <p className="text-white">{stall.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Size</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${sizeColors[stall.size]}`}>
                      {stall.size}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Price</label>
                    <p className="text-white text-xl font-bold">${stall.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${
                        stall.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}
                    >
                      {stall.isAvailable ? 'Available' : 'Reserved'}
                    </span>
                  </div>
                  {stall.description && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                      <p className="text-white">{stall.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservation Information */}
              {!stall.isAvailable && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Reservation Information</h3>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                      <p className="mt-2 text-slate-300 text-sm">Loading reservation info...</p>
                    </div>
                  ) : reservationInfo ? (
                    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Reservation ID</label>
                          <p className="text-white font-semibold">#{reservationInfo.id || reservationInfo.reservationId}</p>
                        </div>
                        {reservationInfo.user && (
                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Reserved By</label>
                            <p className="text-white">
                              {reservationInfo.user.firstName} {reservationInfo.user.lastName}
                            </p>
                            <p className="text-sm text-slate-400">{reservationInfo.user.email}</p>
                          </div>
                        )}
                        {reservationInfo.reservationDate && (
                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Reservation Date</label>
                            <p className="text-white">
                              {new Date(reservationInfo.reservationDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {reservationInfo.status && (
                          <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${
                                reservationInfo.status === 'CONFIRMED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : reservationInfo.status === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-red-500/20 text-red-300 border-red-500/30'
                              }`}
                            >
                              {reservationInfo.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400">Reservation information not available</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-700 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800/60 text-white hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StallDetailModal;

