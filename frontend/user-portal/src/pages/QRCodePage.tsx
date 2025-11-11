import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import { Reservation, ReservationStatus } from '../types';
import { reservationService } from '../services/reservationService';
import { generateQRCodeValue } from '../utils/qrCodeGenerator';
import { toast } from 'react-toastify';

const QRCodePage: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reservationId) {
      loadReservation();
    }
  }, [reservationId]);

  const loadReservation = async () => {
    if (!reservationId) return;

    try {
      setLoading(true);
      const data = await reservationService.getReservationById(parseInt(reservationId));
      setReservation(data);
    } catch (error: any) {
      // Try to load from sessionStorage for mock reservations
      const savedReservation = sessionStorage.getItem(`reservation_${reservationId}`);
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
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrintQR = () => {
    if (!reservation) return;

    const printWindow = window.open('', '_blank');
    if (printWindow && qrRef.current) {
      const qrValue = generateQRCodeValue(reservation);
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Reservation ${reservation.id}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
                background: white;
              }
              .qr-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              svg {
                width: 400px;
                height: 400px;
              }
              h1 {
                margin: 0;
                font-size: 24px;
              }
              p {
                margin: 5px 0;
                font-size: 14px;
              }
              @media print {
                body {
                  page-break-after: always;
                }
              }
            </style>
            <script src="https://unpkg.com/qrcode.react@3.1.0/dist/index.umd.js"></script>
          </head>
          <body>
            <div class="qr-container">
              <h1>Reservation #${reservation.id}</h1>
              <div id="qr-code"></div>
              <p>Reservation Date: ${new Date(reservation.reservationDate).toLocaleDateString()}</p>
              <p>Stalls: ${reservation.stalls.map(s => s.stallNumber).join(', ')}</p>
            </div>
            <script>
              const { QRCodeSVG } = qrcode;
              ReactDOM.render(
                React.createElement(QRCodeSVG, {
                  value: "${qrValue}",
                  size: 400,
                  level: "H",
                  includeMargin: true
                }),
                document.getElementById('qr-code')
              );
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      // Wait for QR code to render before printing
      setTimeout(() => {
        printWindow.print();
      }, 500);
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

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
              
              <div className="relative z-10 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border-[3px] border-indigo-400/70 bg-indigo-500/20 px-4 py-1.5 text-xs font-semibold text-indigo-200 shadow-lg backdrop-blur-sm ring-1 ring-indigo-400/30">
                  <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                  QR Code • CIBF Reservation System
                </div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl mb-3">
                  Reservation{' '}
                  <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
                    QR Code
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300">
                  Reservation #{reservation.id} • {new Date(reservation.reservationDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </motion.div>

          {/* QR Code Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30"
          >
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code Display */}
              <div 
                ref={qrRef}
                className="bg-white p-8 rounded-2xl border-4 border-indigo-500/50 shadow-2xl"
              >
                <QRCodeSVG
                  value={qrValue}
                  size={320}
                  level="H"
                  includeMargin={true}
                  fgColor="#1e293b"
                  bgColor="#ffffff"
                />
              </div>

              {/* Reservation Info */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-500/60 bg-emerald-500/10 px-4 py-2">
                  <span className="text-xs font-semibold text-emerald-200">
                    {reservation.status === ReservationStatus.CONFIRMED ? '✓ Confirmed' : '⏳ Pending'}
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  Show this QR code at the event entrance
                </p>
                <p className="text-xs text-slate-400">
                  Reservation includes {reservation.stalls.length} stall{reservation.stalls.length !== 1 ? 's' : ''} • Total: ${reservation.totalAmount.toFixed(2)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 w-full">
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
                  onClick={handlePrintQR}
                  className="rounded-xl border-2 border-slate-600/60 bg-slate-800/60 hover:bg-slate-800/80 text-slate-200 px-6 py-3 font-semibold transition-all"
                >
                  <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print QR Code
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/reservations/${reservation.id}`)}
                  className="rounded-xl border-2 border-indigo-500/60 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 px-6 py-3 font-semibold transition-all"
                >
                  View Details
                </motion.button>
              </div>
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

export default QRCodePage;


