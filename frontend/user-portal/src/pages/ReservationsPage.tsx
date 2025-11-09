import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Reservation, ReservationStatus } from '../types';
import { reservationService } from '../services/reservationService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const ReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReservationStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (user) {
      loadReservations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadReservations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await reservationService.getUserReservations(user.id);
      setReservations(data);
      // Don't show error if backend is unavailable - empty array is returned
    } catch (error: any) {
      // Only show error if it's not a network error (network errors are handled in service)
      if (!error.message?.includes('unavailable')) {
        toast.error(
          'Failed to load reservations: ' +
            (error.response?.data?.message || error.message)
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await reservationService.cancelReservation(id);
      toast.success('Reservation cancelled successfully');
      loadReservations();
    } catch (error: any) {
      toast.error(
        'Failed to cancel reservation: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const getStatusColor = (status: ReservationStatus): string => {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      case ReservationStatus.PENDING:
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case ReservationStatus.CANCELLED:
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-600/40 text-slate-200 border-slate-500/60';
    }
  };

  const filteredReservations = reservations.filter(
    (res) => filter === 'ALL' || res.status === filter
  );

  const filters: { label: string; value: ReservationStatus | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: ReservationStatus.PENDING },
    { label: 'Confirmed', value: ReservationStatus.CONFIRMED },
    { label: 'Cancelled', value: ReservationStatus.CANCELLED },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
          {/* background */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-1/4 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.800)_1px,transparent_1px)] [background-size:18px_18px] opacity-40" />
            <div className="absolute -left-24 bottom-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/30 blur-2xl" />
            <div className="animation-delay-2000 absolute -right-24 top-10 h-72 w-72 animate-blob rounded-full bg-amber-400/25 blur-2xl" />
          </div>
          <div className="relative z-10 flex h-full items-center justify-center px-4 py-16">
            <div className="flex flex-col items-center gap-4 rounded-2xl border-[3px] border-indigo-500/60 bg-slate-900/80 px-8 py-10 shadow-2xl backdrop-blur-xl ring-2 ring-indigo-500/30">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-400" />
              <p className="text-sm font-medium text-slate-300">
                Loading your reservations...
              </p>
            </div>
          </div>

          <style>{`
            @keyframes blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
            }
            .animate-blob { animation: blob 8s infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
          `}</style>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        {/* Background decorative elements */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-1/4 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.800)_1px,transparent_1px)] [background-size:18px_18px] opacity-40" />
          <div className="absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/30 blur-2xl" />
          <div className="animation-delay-2000 absolute -right-24 top-1/3 h-72 w-72 animate-blob rounded-full bg-amber-400/25 blur-2xl" />
          <div className="animation-delay-4000 absolute left-1/2 bottom-0 h-72 w-72 -translate-x-1/2 animate-blob rounded-full bg-cyan-400/25 blur-2xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            {/* Header Card */}
            <div className="relative overflow-hidden rounded-3xl border-[3px] border-indigo-500/80 bg-gradient-to-br from-slate-900/90 via-indigo-950/50 to-slate-900/90 p-8 shadow-2xl backdrop-blur-xl ring-2 ring-indigo-500/30">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-fuchsia-600/10" />
              
              {/* Decorative elements */}
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
              
              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border-[3px] border-indigo-400/70 bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-200 shadow-lg backdrop-blur-sm ring-1 ring-indigo-400/30">
                    <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                    My Reservations • CIBF Reservation System
                  </div>
                  <h1 className="mb-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                    Manage Your{' '}
                    <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                      Bookings
                    </span>
                  </h1>
                  <p className="max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
                    View the status of your stall reservations, access QR codes, and make changes when needed.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-4 sm:items-end">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.4)" }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate('/stalls')}
                    className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-500 px-6 py-3.5 text-sm font-bold text-white shadow-2xl transition-all hover:shadow-indigo-500/50"
                  >
                    <svg
                      className="h-5 w-5 transition-transform group-hover:rotate-90"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    New Reservation
                  </motion.button>
                  
                  <div className="rounded-xl border-2 border-slate-600/60 bg-slate-800/30 px-4 py-2.5 backdrop-blur-sm ring-1 ring-slate-500/20">
                    <p className="text-xs text-slate-400">
                      📊 Total: <span className="font-bold text-white">{reservations.length}</span> reservations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filter bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8 rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-base font-semibold text-white mb-1">
                  Filter by status
                </p>
                <p className="text-xs text-slate-400">
                  Quickly find reservations that need your attention
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {filters.map((f) => {
                  const active = filter === f.value;
                  return (
                    <motion.button
                      key={f.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilter(f.value)}
                      className={`inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
                        active
                          ? 'border-indigo-400 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg ring-2 ring-indigo-400/30'
                          : 'border-slate-600/60 bg-slate-800/60 text-slate-300 hover:border-indigo-500/60 hover:bg-slate-800/80 ring-1 ring-slate-500/30'
                      }`}
                    >
                      {f.value !== 'ALL' && (
                        <span
                          className={`h-2 w-2 rounded-full ${
                            f.value === ReservationStatus.CONFIRMED
                              ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                              : f.value === ReservationStatus.PENDING
                              ? 'bg-amber-400 shadow-lg shadow-amber-400/50'
                              : f.value === ReservationStatus.CANCELLED
                              ? 'bg-rose-400 shadow-lg shadow-rose-400/50'
                              : 'bg-slate-400'
                          }`}
                        />
                      )}
                      {f.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Reservations List */}
          {filteredReservations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-12 text-center shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-700/50">
                <svg
                  className="h-10 w-10 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {filter === 'ALL'
                  ? 'No reservations found'
                  : `No ${String(filter).toLowerCase()} reservations`}
              </h2>
              <p className="mb-8 text-sm text-slate-400">
                Start by browsing available stalls and making your first booking.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/stalls')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-xl transition hover:shadow-2xl"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Browse Stalls
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredReservations.map((reservation, index) => (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border-[3px] border-slate-600/70 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-900/95 p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-indigo-500/80 hover:shadow-indigo-500/20 ring-2 ring-slate-500/30"
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-fuchsia-600/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  {/* Status indicator bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    reservation.status === ReservationStatus.CONFIRMED
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      : reservation.status === ReservationStatus.PENDING
                      ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                      : 'bg-gradient-to-r from-rose-400 to-rose-600'
                  }`} />
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                          Reservation #{reservation.id}
                        </h3>
                        <div className="space-y-1.5 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              Reserved: {new Date(reservation.reservationDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              Created: {new Date(reservation.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold ${getStatusColor(
                          reservation.status
                        )}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full shadow-lg ${
                            reservation.status === ReservationStatus.CONFIRMED
                              ? 'bg-emerald-400 shadow-emerald-400/50'
                              : reservation.status === ReservationStatus.PENDING
                              ? 'bg-amber-400 shadow-amber-400/50'
                              : reservation.status === ReservationStatus.CANCELLED
                              ? 'bg-rose-400 shadow-rose-400/50'
                              : 'bg-slate-400'
                          }`}
                        />
                        {reservation.status}
                      </span>
                    </div>

                    {/* Info Cards */}
                    <div className="mb-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border-2 border-slate-700/50 bg-slate-800/40 p-3 backdrop-blur-sm">
                        <p className="text-xs text-slate-400 mb-1">Stalls</p>
                        <p className="text-xl font-bold text-white">
                          {reservation.stalls.length}
                        </p>
                      </div>
                      <div className="rounded-xl border-2 border-indigo-500/40 bg-indigo-500/10 p-3 backdrop-blur-sm">
                        <p className="text-xs text-slate-400 mb-1">Total</p>
                        <p className="text-xl font-bold text-indigo-300">
                          ${reservation.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Stall badges */}
                    <div className="mb-5 flex flex-wrap gap-2">
                      {reservation.stalls.map((stall) => (
                        <span
                          key={stall.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm"
                        >
                          <svg
                            className="h-3.5 w-3.5 text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7"
                            />
                          </svg>
                          Stall {stall.stallNumber}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/reservations/${reservation.id}`)}
                        className="flex-1 rounded-xl border-2 border-indigo-500/60 bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:shadow-xl"
                      >
                        View Details
                      </motion.button>
                      {reservation.qrCodeUrl && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => navigate(`/qr/${reservation.id}`)}
                          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-500/60 bg-emerald-600/80 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-600 hover:shadow-emerald-500/30"
                          title="View QR Code"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5h4v4H3V5zm0 10h4v4H3v-4zm14-10h4v4h-4V5zm0 10h4v4h-4v-4z"
                            />
                          </svg>
                          QR
                        </motion.button>
                      )}
                      {reservation.status !== ReservationStatus.CANCELLED && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCancelReservation(reservation.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-500/60 bg-rose-600/80 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-rose-600 hover:shadow-rose-500/30"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Local styles for blob animation */}
        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 8s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>
    </Layout>
  );
};

export default ReservationsPage;
