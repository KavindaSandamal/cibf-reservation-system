import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Reservation, ReservationStatus } from '../types';
import { reservationService } from '../services/reservationService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error: any) {
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

  const recentReservations = reservations.slice(0, 5);
  const pendingCount = reservations.filter(
    (r) => r.status === ReservationStatus.PENDING
  ).length;
  const confirmedCount = reservations.filter(
    (r) => r.status === ReservationStatus.CONFIRMED
  ).length;

  const totalAmount = reservations.reduce((sum, r) => sum + r.totalAmount, 0);

  const getStatusColor = (status: ReservationStatus) => {
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

  const today = new Date();
  const upcomingReservation = [...reservations]
    .filter(
      (r) =>
        (r.status === ReservationStatus.CONFIRMED ||
          r.status === ReservationStatus.PENDING) &&
        new Date(r.reservationDate) >= today
    )
    .sort(
      (a, b) =>
        new Date(a.reservationDate).getTime() -
        new Date(b.reservationDate).getTime()
    )[0];

  const confirmedRatio =
    reservations.length > 0 ? confirmedCount / reservations.length : 0;

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        {/* Background decorative elements */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-1/4 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.800)_1px,transparent_1px)] [background-size:18px_18px] opacity-40" />
          <div className="absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/30 blur-2xl" />
          <div className="animation-delay-2000 absolute -right-24 top-1/3 h-72 w-72 animate-blob rounded-full bg-amber-400/25 blur-2xl" />
          <div className="animation-delay-4000 absolute left-1/2 bottom-0 h-72 w-72 -translate-x-1/2 animate-blob rounded-full bg-cyan-400/25 blur-2xl" />
        </div>

        {/* Content Area */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section (NEW) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/60 bg-gradient-to-br from-slate-950/95 via-indigo-950/90 to-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
              {/* subtle glow + lines */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent opacity-70" />
                <div className="absolute -left-40 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-fuchsia-500/15 blur-3xl" />
                <div className="absolute -right-40 top-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_0_0,rgba(148,163,253,0.16),transparent_60%),radial-gradient(circle_at_100%_0,rgba(192,132,252,0.16),transparent_60%)]" />
              </div>

              <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                {/* Left: greeting + summary */}
                <div className="flex-1">
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-200/90">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/15 px-3 py-1 shadow-sm">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow shadow-emerald-400/60" />
                      Dashboard • CIBF Reservation System
                    </span>
                    <span className="hidden sm:inline text-slate-400">|</span>
                    <span className="hidden sm:inline rounded-full bg-slate-800/70 px-3 py-1 text-[11px] text-slate-300">
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h1 className="mb-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                    Welcome back,&nbsp;
                    <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                      {user?.firstName || 'Guest'}
                    </span>
                    <span className="text-white">.</span>
                  </h1>

                  <p className="mb-6 max-w-2xl text-sm sm:text-lg leading-relaxed text-slate-300">
                    Manage your CIBF stall reservations, keep track of confirmations, and
                    see how your bookings are shaping up at a glance.
                  </p>

                  {/* quick micro–stats under heading */}
                  <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-600/70 bg-slate-900/70 px-3 py-1.5 text-slate-200">
                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                      <span className="font-semibold">
                        {loading ? '—' : reservations.length}
                      </span>
                      <span className="text-slate-400">total reservations</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold">
                        {loading ? '—' : confirmedCount}
                      </span>
                      <span className="text-emerald-200/80">confirmed</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/60 bg-fuchsia-500/10 px-3 py-1.5 text-fuchsia-200">
                      <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
                      <span className="font-semibold">
                        {loading ? '—' : `$${totalAmount.toFixed(2)}`}
                      </span>
                      <span className="text-fuchsia-200/80">total spent</span>
                    </div>
                  </div>
                </div>

                {/* Right: profile + upcoming reservation */}
                <div className="flex w-full max-w-xs flex-col gap-4 md:items-end">
                  {/* mini profile card */}
                  <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-600/70 bg-slate-950/70 px-4 py-3 shadow-lg backdrop-blur-xl">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg font-bold text-white shadow-md">
                      {(user?.firstName && user.firstName[0]) || 'U'}
                    </div>
                    <div className="flex-1 leading-tight">
                      <p className="text-sm font-semibold text-slate-50">
                        {user?.firstName ? `${user.firstName}` : 'CIBF User'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        CIBF Reservation • User Portal
                      </p>
                    </div>
                  </div>

                  {/* CTA + upcoming */}
                  <div className="flex w-full flex-col gap-3 md:items-end">
                    <motion.button
                      whileHover={{
                        scale: 1.05,
                        boxShadow: '0 18px 35px -10px rgba(129,140,248,0.7)',
                      }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate('/stalls')}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-500 px-5 py-3 text-sm font-bold text-white shadow-2xl md:w-auto"
                    >
                      <svg
                        className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.3}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      New Reservation
                    </motion.button>

                    {upcomingReservation && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full rounded-2xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100 shadow-lg backdrop-blur-xl md:text-[13px]"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] text-white">
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </span>
                            Next reservation
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px]">
                            {upcomingReservation.stalls.length} stall
                            {upcomingReservation.stalls.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="font-semibold">
                          {new Date(
                            upcomingReservation.reservationDate
                          ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="mt-0.5 text-[11px] text-emerald-200/80">
                          Tap any reservation card below to view full details and QR.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Total Reservations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative col-span-1 overflow-hidden rounded-2xl border-[3px] border-blue-500/90 bg-gradient-to-br from-slate-900/95 via-blue-950/30 to-slate-900/95 p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-blue-400 hover:shadow-blue-500/50 ring-2 ring-blue-500/40"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/30 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Reservations
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {loading ? (
                      <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-700" />
                    ) : (
                      reservations.length
                    )}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Across all events and days
                  </p>
                </div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl ring-2 ring-blue-500/30">
                  <svg
                    className="h-7 w-7"
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
              </div>
            </motion.div>

            {/* Pending */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative col-span-1 overflow-hidden rounded-2xl border-[3px] border-amber-500/90 bg-gradient-to-br from-slate-900/95 via-amber-950/30 to-slate-900/95 p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-amber-400 hover:shadow-amber-500/50 ring-2 ring-amber-500/40"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/30 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-transparent" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Pending
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {loading ? (
                      <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-700" />
                    ) : (
                      pendingCount
                    )}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Waiting for confirmation
                  </p>
                </div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-xl ring-2 ring-amber-500/30">
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Confirmed + progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative col-span-1 overflow-hidden rounded-2xl border-[3px] border-emerald-500/90 bg-gradient-to-br from-slate-900/95 via-emerald-950/30 to-slate-900/95 p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-emerald-400 hover:shadow-emerald-500/50 ring-2 ring-emerald-500/40"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/30 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Confirmed
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {loading ? (
                        <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-700" />
                      ) : (
                        confirmedCount
                      )}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Ready for the event
                    </p>
                  </div>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-xl ring-2 ring-emerald-500/30">
                    <svg
                      className="h-7 w-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Confirmation rate</span>
                    <span className="font-bold text-emerald-300">
                      {reservations.length === 0
                        ? '0%'
                        : `${Math.round(confirmedRatio * 100)}%`}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/50 ring-1 ring-slate-700/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-400 transition-all shadow-lg shadow-emerald-500/30"
                      style={{ width: `${confirmedRatio * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Total Spent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative col-span-1 overflow-hidden rounded-2xl border-[3px] border-fuchsia-500/90 bg-gradient-to-br from-slate-900/95 via-fuchsia-950/40 to-purple-950/40 p-6 shadow-2xl backdrop-blur-xl transition-all hover:border-fuchsia-400 hover:shadow-fuchsia-500/50 ring-2 ring-fuchsia-500/40"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-fuchsia-500/40 blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/10 via-purple-600/5 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-300/90">
                      Total Spent
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {loading ? (
                        <span className="inline-block h-8 w-24 animate-pulse rounded bg-slate-800" />
                      ) : (
                        `$${totalAmount.toFixed(2)}`
                      )}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Across all your reservations
                    </p>
                  </div>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-xl ring-2 ring-fuchsia-500/40">
                    <svg
                      className="h-7 w-7 text-emerald-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.646 1M12 8V7m0 10v1m8-8a8 8 0 11-16 0 8 8 0 0116 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-5 rounded-lg border-2 border-slate-600/60 bg-slate-800/20 px-3 py-2 ring-1 ring-slate-500/20">
                  <p className="text-[11px] text-slate-400">
                    💡 Download invoices from reservation details
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-8 rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
              <span className="text-xs text-slate-400">
                Your most common tasks in one place
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/stalls')}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-xl"
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/reservations')}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-400/70 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-indigo-100 shadow-md ring-1 ring-indigo-400/30"
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                View All Reservations
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/book')}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-fuchsia-400/70 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-fuchsia-200 shadow-md ring-1 ring-fuchsia-400/30"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Book New Stall
              </motion.button>
            </div>
          </motion.div>

          {/* Recent Reservations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Recent Reservations</h2>
                <p className="text-sm text-slate-400">
                  A quick look at your latest activity.
                </p>
              </div>
              {recentReservations.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/reservations')}
                  className="text-sm font-semibold text-indigo-200 hover:text-indigo-100"
                >
                  View all →
                </motion.button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <svg
                    className="h-8 w-8 animate-spin text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-sm text-slate-400">
                    Loading reservations...
                  </p>
                </div>
              </div>
            ) : recentReservations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                  <svg
                    className="h-8 w-8 text-slate-400"
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
                <h3 className="mb-2 text-lg font-semibold">
                  No reservations yet
                </h3>
                <p className="mb-6 text-sm text-slate-400">
                  Get started by browsing available stalls and securing your
                  perfect spot.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/stalls')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-xl"
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
              <div className="space-y-4">
                {recentReservations.map((reservation, index) => (
                  <motion.div
                    key={reservation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() =>
                      navigate(`/reservations/${reservation.id}`)
                    }
                    className="group cursor-pointer rounded-xl border-[3px] border-slate-500/80 bg-slate-900/60 p-5 transition-all hover:border-indigo-400/90 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-indigo-500/30 ring-1 ring-slate-500/40"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-base font-semibold">
                            Reservation #{reservation.id}
                          </h3>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                              reservation.status
                            )}`}
                          >
                            {reservation.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                          <span className="flex items-center gap-1">
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {new Date(
                              reservation.reservationDate
                            ).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
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
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            {reservation.stalls.length} stall
                            {reservation.stalls.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-xl sm:text-2xl font-bold">
                          ${reservation.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400">Total amount</p>
                        <svg
                          className="mt-2 h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
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

export default DashboardPage;
