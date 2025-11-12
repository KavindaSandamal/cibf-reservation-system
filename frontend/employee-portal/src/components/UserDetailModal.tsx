import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Reservation } from '../types';
import { userService } from '../services/userService';
import { reservationService } from '../services/reservationService';
import { toast } from 'react-toastify';

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userGenres, setUserGenres] = useState<any[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      loadUserDetails();
    }
  }, [isOpen, user]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      
      // Load user profile
      try {
        const profile = await userService.getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.warn('User profile not available');
      }
      
      // Load user genres
      try {
        const genres = await userService.getUserGenres(user.id);
        setUserGenres(genres);
      } catch (error) {
        console.warn('User genres not available');
      }
      
      // Load user reservations
      try {
        const userReservations = await reservationService.getReservationsByUserId(user.id);
        setReservations(userReservations);
      } catch (error) {
        console.warn('User reservations not available');
      }
    } catch (error: any) {
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
            className="relative z-10 w-full max-w-4xl rounded-2xl border-2 border-slate-700/70 bg-slate-900/95 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
              <div>
                <h2 className="text-2xl font-bold text-white">User Details</h2>
                <p className="text-sm text-slate-400">ID: #{user.id}</p>
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
            {loading ? (
              <div className="p-6 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                <p className="mt-4 text-slate-300">Loading user details...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* User Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                      <p className="text-white">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                      <p className="text-white">{user.email}</p>
                    </div>
                    {user.businessName && (
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Business Name</label>
                        <p className="text-white">{user.businessName}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Joined Date</label>
                      <p className="text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Literary Genres */}
                {userGenres.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Literary Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {userGenres.map((genre, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm border border-indigo-500/30"
                        >
                          {typeof genre === 'string' ? genre : genre.name || genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reservation History */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Reservation History ({reservations.length})
                  </h3>
                  {reservations.length === 0 ? (
                    <p className="text-slate-400">No reservations found</p>
                  ) : (
                    <div className="space-y-3">
                      {reservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          className="rounded-xl border border-slate-700 bg-slate-800/60 p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold text-white">Reservation #{reservation.id}</span>
                              <span className={`ml-3 px-2 py-1 rounded text-xs font-semibold border ${
                                reservation.status === 'CONFIRMED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : reservation.status === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-red-500/20 text-red-300 border-red-500/30'
                              }`}>
                                {reservation.status}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-white">
                              ${reservation.totalAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">
                            Date: {new Date(reservation.reservationDate).toLocaleDateString()}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {reservation.stalls.map((stall) => (
                              <span
                                key={stall.id}
                                className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs"
                              >
                                {stall.stallNumber}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

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

export default UserDetailModal;

