import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Reservation, ReservationStatus } from '../types';
import { reservationService } from '../services/reservationService';
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

  const loadReservation = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await reservationService.getReservationById(parseInt(id));
      setReservation(data);
    } catch (error: any) {
      toast.error('Failed to load reservation: ' + (error.response?.data?.message || error.message));
      navigate('/reservations');
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
    if (!reservation?.qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = reservation.qrCodeUrl;
    link.download = `qr-code-reservation-${reservation.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: ReservationStatus): string => {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case ReservationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ReservationStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!reservation) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Reservation not found</p>
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reservation #{reservation.id}
            </h1>
            <p className="mt-2 text-gray-600">
              View reservation details and QR code
            </p>
          </div>
          <button
            onClick={() => navigate('/reservations')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Reservations
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  reservation.status
                )}`}
              >
                {reservation.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Reservation Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(reservation.reservationDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Created At</h3>
              <p className="text-gray-900">
                {new Date(reservation.createdAt).toLocaleString()}
              </p>
            </div>
            {reservation.confirmedAt && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Confirmed At</h3>
                <p className="text-gray-900">
                  {new Date(reservation.confirmedAt).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Total Amount</h3>
              <p className="text-2xl font-bold text-primary-600">
                ${reservation.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Number of Stalls</h3>
              <p className="text-gray-900 text-lg font-semibold">
                {reservation.stalls.length}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reserved Stalls</h3>
            <div className="space-y-3">
              {reservation.stalls.map((stall) => (
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
                    {stall.description && (
                      <p className="text-sm text-gray-500 mt-1">{stall.description}</p>
                    )}
                  </div>
                  <span className="text-lg font-bold text-gray-900">${stall.price}</span>
                </div>
              ))}
            </div>
          </div>

          {reservation.qrCodeUrl && (
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 border-2 border-gray-200 rounded-lg">
                  <img
                    src={reservation.qrCodeUrl}
                    alt={`QR Code for Reservation ${reservation.id}`}
                    className="w-64 h-64"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleDownloadQR}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
                  >
                    Download QR Code
                  </button>
                  <button
                    onClick={() => navigate(`/qr/${reservation.id}`)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    View Full Screen
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6 flex space-x-4">
            {reservation.status !== ReservationStatus.CANCELLED && (
              <button
                onClick={handleCancelReservation}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
              >
                Cancel Reservation
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReservationDetailsPage;


