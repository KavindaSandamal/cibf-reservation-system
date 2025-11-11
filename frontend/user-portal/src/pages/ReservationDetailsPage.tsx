import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Reservation, ReservationStatus } from '../types';
import { reservationService } from '../services/reservationService';
import { generateQRCodeValue } from '../utils/qrCodeGenerator';
import { toast } from 'react-toastify';

const ReservationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadReservation();
    }
  }, [id]);

  const qrRef = useRef<HTMLDivElement>(null);

  const loadReservation = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await reservationService.getReservationById(parseInt(id));
      setReservation(data);
    } catch (error: any) {
      // Try to load from sessionStorage for mock reservations
      const savedReservation = sessionStorage.getItem(`reservation_${id}`);
      if (savedReservation) {
        try {
          const reservation = JSON.parse(savedReservation);
          setReservation(reservation);
        } catch (e) {
          console.error('Error loading saved reservation:', e);
          toast.error('Failed to load reservation');
          navigate('/reservations');
        }
      } else {
        toast.error('Failed to load reservation: ' + (error.response?.data?.message || error.message));
        navigate('/reservations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation || !window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await reservationService.cancelReservation(reservation.id);
      toast.success('Reservation cancelled successfully');
      loadReservation();
    } catch (error: any) {
      toast.error('Failed to cancel reservation: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadQR = () => {
    if (!reservation) return;

    // Get the SVG element and convert to PNG
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `qr-code-reservation-${reservation.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('QR code downloaded successfully!');
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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

  if (loading) {
    return (
      <Layout>
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500/30 border-t-indigo-400"></div>
              <p className="text-slate-300">Loading reservation...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!reservation) {
    return (
      <Layout>
        <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="text-center py-12">
            <p className="text-slate-300 text-lg mb-4">Reservation not found</p>
            <button
              onClick={() => navigate('/reservations')}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white px-6 py-3 font-semibold shadow-lg transition-all"
            >
              Back to Reservations
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const qrValue = generateQRCodeValue(reservation);

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

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border-[3px] border-indigo-400/70 bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-200 shadow-lg backdrop-blur-sm ring-1 ring-indigo-400/30">
                    <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                    Reservation Details • CIBF Reservation System
                  </div>
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl mb-3">
                    Reservation{' '}
                    <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                      #{reservation.id}
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg text-slate-300">
                    View reservation details and QR code
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/reservations')}
                  className="rounded-xl border-2 border-slate-600/60 bg-slate-800/60 hover:bg-slate-800/80 text-slate-200 px-6 py-3 font-semibold transition-all"
                >
                  ← Back to Reservations
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Reservation Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30 mb-8"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(
                    reservation.status
                  )}`}
                >
                  <span className={`h-2 w-2 rounded-full ${
                    reservation.status === ReservationStatus.CONFIRMED ? 'bg-emerald-400' :
                    reservation.status === ReservationStatus.PENDING ? 'bg-amber-400' :
                    'bg-rose-400'
                  }`} />
                  {reservation.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Reservation Date</p>
                <p className="text-lg font-bold text-white">
                  {new Date(reservation.reservationDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border-2 border-slate-700/50 bg-slate-800/40 p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Created At</h3>
                <p className="text-white font-medium">
                  {new Date(reservation.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {reservation.confirmedAt && (
                <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4">
                  <h3 className="text-sm font-semibold text-slate-400 mb-2">Confirmed At</h3>
                  <p className="text-white font-medium">
                    {new Date(reservation.confirmedAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              <div className="rounded-xl border-2 border-fuchsia-500/40 bg-fuchsia-500/10 p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Total Amount</h3>
                <p className="text-2xl font-black text-fuchsia-300">
                  ${reservation.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border-2 border-slate-700/50 bg-slate-800/40 p-4">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Number of Stalls</h3>
                <p className="text-white text-2xl font-bold">
                  {reservation.stalls.length}
                </p>
              </div>
            </div>

            <div className="border-t-2 border-slate-700/50 pt-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Reserved Stalls
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reservation.stalls.map((stall, index) => (
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
                      {stall.description && (
                        <p className="text-xs text-slate-500 mt-1">{stall.description}</p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-indigo-300">${stall.price}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* QR Code Section - Always show if reservation exists */}
            <div className="border-t-2 border-slate-700/50 pt-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR Code
              </h3>
              <div className="flex flex-col items-center space-y-4">
                <div 
                  ref={qrRef}
                  className="bg-white p-6 rounded-2xl border-4 border-indigo-500/50 shadow-2xl"
                >
                  <QRCodeSVG
                    value={qrValue}
                    size={256}
                    level="H"
                    includeMargin={true}
                    fgColor="#1e293b"
                    bgColor="#ffffff"
                  />
                </div>
                <p className="text-sm text-slate-400 text-center">
                  Show this QR code at the event entrance for easy check-in
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadQR}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white px-6 py-3 font-bold shadow-lg transition-all"
                  >
                    <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download QR Code
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/qr/${reservation.id}`)}
                    className="rounded-xl border-2 border-indigo-500/60 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 px-6 py-3 font-semibold transition-all"
                  >
                    View Full Screen
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-slate-700/50 pt-6 flex space-x-4">
              {reservation.status !== ReservationStatus.CANCELLED && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelReservation}
                  className="rounded-xl border-2 border-rose-500/60 bg-rose-600/80 hover:bg-rose-600 text-white px-6 py-3 font-bold shadow-lg transition-all"
                >
                  Cancel Reservation
                </motion.button>
              )}
            </div>
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

export default ReservationDetailsPage;


