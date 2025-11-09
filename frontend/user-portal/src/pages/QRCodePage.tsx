import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Reservation } from '../types';
import { reservationService } from '../services/reservationService';
import { toast } from 'react-toastify';

const QRCodePage: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

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
      toast.error('Failed to load reservation: ' + (error.response?.data?.message || error.message));
      navigate('/reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!reservation?.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = reservation.qrCodeUrl;
    link.download = `qr-code-reservation-${reservation.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    if (!reservation?.qrCodeUrl) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
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
              }
              img {
                max-width: 500px;
                max-height: 500px;
              }
              h1 {
                margin-bottom: 20px;
              }
              @media print {
                body {
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body>
            <h1>Reservation #${reservation.id}</h1>
            <img src="${reservation.qrCodeUrl}" alt="QR Code" />
            <p>Reservation Date: ${new Date(reservation.reservationDate).toLocaleDateString()}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!reservation || !reservation.qrCodeUrl) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">QR Code not available for this reservation</p>
          <button
            onClick={() => navigate('/reservations')}
            className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
          >
            Back to Reservations
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reservation QR Code
            </h1>
            <p className="text-gray-600">
              Reservation #{reservation.id} •{' '}
              {new Date(reservation.reservationDate).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <div className="bg-white p-8 border-4 border-gray-300 rounded-lg shadow-lg">
              <img
                src={reservation.qrCodeUrl}
                alt={`QR Code for Reservation ${reservation.id}`}
                className="w-80 h-80"
              />
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Show this QR code at the event entrance
              </p>
              <p className="text-xs text-gray-500">
                Reservation includes {reservation.stalls.length} stall(s)
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleDownloadQR}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
              >
                Download QR Code
              </button>
              <button
                onClick={handlePrintQR}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
              >
                Print QR Code
              </button>
              <button
                onClick={() => navigate(`/reservations/${reservation.id}`)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                View Reservation Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QRCodePage;


