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

const BookPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<BookingStep>('select');
  const [bookingData, setBookingData] = useState<BookingData>({
    selectedStalls: [],
    reservationDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const reservationRequest: ReservationRequest = {
        userId: user.id,
        reservationDate: bookingData.reservationDate,
        stallIds: bookingData.selectedStalls.map((s) => s.id),
      };

      const reservation = await reservationService.createReservation(reservationRequest);
      setBookingData((prev) => ({ ...prev, reservationId: reservation.id }));
      setStep('success');
      toast.success('Reservation created successfully!');
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

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(['select', 'review', 'confirm', 'success'] as BookingStep[]).map(
              (s, index) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step === s
                          ? 'bg-primary-600 text-white'
                          : index < (['select', 'review', 'confirm', 'success'].indexOf(step) + 1)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="mt-2 text-sm font-medium text-gray-700 capitalize">
                      {s}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        index < (['select', 'review', 'confirm', 'success'].indexOf(step))
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Step 1: Select Stalls
                </h2>
                <StallMap
                  onStallsSelect={handleStallsSelect}
                  selectedStallIds={bookingData.selectedStalls.map((s) => s.id)}
                  maxSelection={3}
                />
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleNext}
                    disabled={bookingData.selectedStalls.length === 0}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
                  >
                    Review Selection
                  </button>
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
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Step 2: Review Selection
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Selected Stalls
                    </h3>
                    <div className="space-y-3">
                      {bookingData.selectedStalls.map((stall) => (
                        <div
                          key={stall.id}
                          className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {stall.stallNumber} - {stall.stallName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {stall.size} • {stall.location}
                            </p>
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            ${stall.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={handleBack}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
                  >
                    Confirm Details
                  </button>
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
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Step 3: Confirm Reservation
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Reservation Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(bookingData.reservationDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Number of Stalls:</span>
                        <span className="font-medium text-gray-900">
                          {bookingData.selectedStalls.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-primary-600">
                          ${totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Selected Stalls
                    </h3>
                    <div className="space-y-2">
                      {bookingData.selectedStalls.map((stall) => (
                        <div
                          key={stall.id}
                          className="flex justify-between text-sm p-2 bg-gray-50 rounded"
                        >
                          <span className="text-gray-700">
                            {stall.stallNumber} - {stall.stallName}
                          </span>
                          <span className="font-medium text-gray-900">
                            ${stall.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 mr-2"
                      required
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I agree to the terms and conditions of the reservation
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={handleBack}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmReservation}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
                  >
                    {loading ? 'Processing...' : 'Confirm Reservation'}
                  </button>
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
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <svg
                      className="h-8 w-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Reservation Confirmed!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your reservation has been successfully created. A confirmation email has been
                  sent to your email address.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleViewReservation}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
                  >
                    View Reservation
                  </button>
                  <button
                    onClick={() => navigate('/reservations')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    My Reservations
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default BookPage;


