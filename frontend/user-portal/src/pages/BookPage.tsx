import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import StallMap from '../components/StallMap';
import { Stall, ReservationRequest } from '../types';
import { reservationService } from '../services/reservationService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

type BookingStep = 'select' | 'review' | 'confirm' | 'success';

interface BookingData {
  selectedStalls: Stall[];
  reservationDate: string;
  reservationId?: number;
}

const steps: { key: BookingStep; label: string; icon: string }[] = [
  { key: 'select', label: 'Select Stalls', icon: '📍' },
  { key: 'review', label: 'Review', icon: '📋' },
  { key: 'confirm', label: 'Confirm', icon: '✓' },
  { key: 'success', label: 'Success', icon: '🎉' },
];

const BookPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<BookingStep>('select');
  const [bookingData, setBookingData] = useState<BookingData>({
    selectedStalls: [],
    reservationDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    // Load selected stalls from sessionStorage if coming from stalls page
    const savedStalls = sessionStorage.getItem('selectedStalls');
    if (savedStalls) {
      try {
        const stalls = JSON.parse(savedStalls);
        setBookingData((prev) => ({ ...prev, selectedStalls: stalls }));
        setStep('review');
        sessionStorage.removeItem('selectedStalls');
      } catch (error) {
        console.error('Error loading saved stalls:', error);
      }
    }
  }, []);

  const handleStallsSelect = (stalls: Stall[]) => {
    setBookingData((prev) => ({ ...prev, selectedStalls: stalls }));
  };

  const handleNext = () => {
    if (step === 'select') {
      if (bookingData.selectedStalls.length === 0) {
        toast.warning('Please select at least one stall');
        return;
      }
      setStep('review');
    } else if (step === 'review') {
      setStep('confirm');
    }
  };

  const handleBack = () => {
    if (step === 'review') {
      setStep('select');
    } else if (step === 'confirm') {
      setStep('review');
    }
  };

  const handleConfirmReservation = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    if (bookingData.selectedStalls.length === 0) {
      toast.error('Please select at least one stall');
      return;
    }

    if (!termsAccepted) {
      toast.warning('Please accept the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const reservationRequest: ReservationRequest = {
        userId: user.id,
        reservationDate: bookingData.reservationDate,
        stallIds: bookingData.selectedStalls.map((s) => s.id),
      };

      // Try actual API call first
      try {
        const reservation = await reservationService.createReservation(reservationRequest);
        setBookingData((prev) => ({ ...prev, reservationId: reservation.id }));
        setStep('success');
        toast.success('Reservation created successfully!');
      } catch (apiError: any) {
        // If backend is unavailable, use mock mode
        if (apiError.code === 'ERR_NETWORK' || apiError.message?.includes('Network Error') || apiError.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.warn('Backend unavailable, using mock reservation');
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 1500));
          
      // Create mock reservation ID
      const mockReservationId = Math.floor(Math.random() * 10000) + 1;
      
      // Create mock reservation object and save to sessionStorage
      const mockReservation = {
        id: mockReservationId,
        userId: user.id,
        reservationDate: bookingData.reservationDate,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
        totalAmount: totalAmount,
        stalls: bookingData.selectedStalls,
      };
      
      // Save to sessionStorage so it can be accessed by other pages
      sessionStorage.setItem(`reservation_${mockReservationId}`, JSON.stringify(mockReservation));
      
      setBookingData((prev) => ({ ...prev, reservationId: mockReservationId }));
      setStep('success');
      toast.success('Reservation created successfully! (Mock Mode - Backend not available)');
        } else {
          throw apiError;
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReservation = () => {
    if (bookingData.reservationId) {
      navigate(`/reservations/${bookingData.reservationId}`);
    }
  };

  const totalAmount = bookingData.selectedStalls.reduce(
    (sum, stall) => sum + stall.price,
    0
  );

  const currentStepIndex = steps.findIndex((s) => s.key === step);

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

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="relative overflow-hidden rounded-3xl border-[3px] border-indigo-500/80 bg-gradient-to-br from-slate-900/90 via-indigo-950/50 to-slate-900/90 p-8 shadow-2xl backdrop-blur-xl ring-2 ring-indigo-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-fuchsia-600/10" />
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
              
              <div className="relative z-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border-[3px] border-indigo-400/70 bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-200 shadow-lg backdrop-blur-sm ring-1 ring-indigo-400/30">
                  <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                  Booking Wizard • CIBF Reservation System
                </div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl mb-3">
                  Create Your{' '}
                  <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                    Reservation
                  </span>
                </h1>
                <p className="max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
                  Follow the steps below to select stalls and complete your reservation.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30"
          >
            <div className="flex items-center justify-between">
              {steps.map((stepItem, index) => {
                const isActive = step === stepItem.key;
                const isCompleted = index < currentStepIndex;
                const isPending = index > currentStepIndex;

                return (
                  <div key={stepItem.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/50 ring-4 ring-indigo-500/30'
                            : isCompleted
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                            : 'bg-slate-700 text-slate-400 border-2 border-slate-600'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-lg">{stepItem.icon}</span>
                        )}
                      </motion.div>
                      <span
                        className={`mt-3 text-xs font-semibold text-center ${
                          isActive
                            ? 'text-indigo-300'
                            : isCompleted
                            ? 'text-emerald-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {stepItem.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 mx-4 h-1 relative">
                        <div className="absolute inset-0 bg-slate-700 rounded-full" />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: isCompleted || isActive ? '100%' : '0%' }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">📍</span>
                    Step 1: Select Stalls
                  </h2>
                  <StallMap
                    onStallsSelect={handleStallsSelect}
                    selectedStallIds={bookingData.selectedStalls.map((s) => s.id)}
                    maxSelection={3}
                  />
                  <div className="mt-6 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNext}
                      disabled={bookingData.selectedStalls.length === 0}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white px-8 py-3 font-bold shadow-lg transition-all disabled:opacity-50"
                    >
                      Review Selection →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">📋</span>
                    Step 2: Review Selection
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-200 mb-2">
                        Reservation Date
                      </label>
                      <input
                        type="date"
                        value={bookingData.reservationDate}
                        onChange={(e) =>
                          setBookingData((prev) => ({
                            ...prev,
                            reservationDate: e.target.value,
                          }))
                        }
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-600/60 bg-slate-800/60 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Selected Stalls ({bookingData.selectedStalls.length})
                      </h3>
                      <div className="space-y-3">
                        {bookingData.selectedStalls.map((stall, index) => (
                          <motion.div
                            key={stall.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex justify-between items-center p-4 rounded-xl border-2 border-slate-700/50 bg-slate-800/60 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all"
                          >
                            <div>
                              <h4 className="font-bold text-white">
                                {stall.stallNumber} - {stall.stallName}
                              </h4>
                              <p className="text-sm text-slate-400">
                                {stall.size} • {stall.location}
                              </p>
                            </div>
                            <span className="text-xl font-bold text-indigo-300">
                              ${stall.price}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border-2 border-indigo-500/60 bg-indigo-500/10 p-5 backdrop-blur-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-indigo-200">Total Amount:</span>
                        <span className="text-3xl font-black text-white">
                          ${totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBack}
                      className="rounded-xl border-2 border-slate-600/60 bg-slate-800/60 hover:bg-slate-800/80 text-slate-200 px-6 py-3 font-semibold transition-all"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNext}
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white px-8 py-3 font-bold shadow-lg transition-all"
                    >
                      Confirm Details →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">✓</span>
                    Step 3: Confirm Reservation
                  </h2>
                  <div className="space-y-6">
                    <div className="rounded-xl border-2 border-emerald-500/60 bg-emerald-500/10 p-5 backdrop-blur-sm">
                      <h3 className="text-lg font-semibold text-emerald-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Reservation Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Date:</span>
                          <span className="font-bold text-white">
                            {new Date(bookingData.reservationDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">Number of Stalls:</span>
                          <span className="font-bold text-white">
                            {bookingData.selectedStalls.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-emerald-500/30">
                          <span className="text-lg font-semibold text-emerald-200">Total Amount:</span>
                          <span className="text-2xl font-black text-white">
                            ${totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Selected Stalls
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {bookingData.selectedStalls.map((stall, index) => (
                          <motion.div
                            key={stall.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex justify-between items-center p-3 rounded-lg border-2 border-slate-700/50 bg-slate-800/60"
                          >
                            <div>
                              <span className="text-sm font-semibold text-white">
                                {stall.stallNumber}
                              </span>
                              <p className="text-xs text-slate-400">{stall.location}</p>
                            </div>
                            <span className="font-bold text-indigo-300">${stall.price}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border-2 border-slate-600/60 bg-slate-800/40 p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                        />
                        <label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
                          I agree to the{' '}
                          <span className="text-indigo-400 hover:text-indigo-300 underline">
                            terms and conditions
                          </span>{' '}
                          of the reservation
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBack}
                      className="rounded-xl border-2 border-slate-600/60 bg-slate-800/60 hover:bg-slate-800/80 text-slate-200 px-6 py-3 font-semibold transition-all"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: termsAccepted && !loading ? 1.05 : 1 }}
                      whileTap={{ scale: termsAccepted && !loading ? 0.95 : 1 }}
                      onClick={handleConfirmReservation}
                      disabled={loading || !termsAccepted}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white px-8 py-3 font-bold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Confirm Reservation
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <div className="rounded-2xl border-[3px] border-emerald-500/80 bg-gradient-to-br from-slate-900/90 via-emerald-950/30 to-slate-900/90 p-12 text-center shadow-2xl backdrop-blur-xl ring-2 ring-emerald-500/30">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-green-600/10 rounded-2xl" />
                  <div className="relative z-10">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      className="mb-6 mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 shadow-2xl shadow-emerald-500/50"
                    >
                      <svg
                        className="h-12 w-12 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl font-black text-white mb-4"
                    >
                      Reservation Confirmed! 🎉
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-slate-300 mb-8 text-lg max-w-md mx-auto"
                    >
                      Your reservation has been successfully created. Reservation ID: <span className="font-bold text-emerald-300">#{bookingData.reservationId}</span>
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleViewReservation}
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white px-8 py-3 font-bold shadow-lg transition-all"
                      >
                        View Reservation
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/reservations')}
                        className="rounded-xl border-2 border-slate-600/60 bg-slate-800/60 hover:bg-slate-800/80 text-slate-200 px-8 py-3 font-semibold transition-all"
                      >
                        My Reservations
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

export default BookPage;


