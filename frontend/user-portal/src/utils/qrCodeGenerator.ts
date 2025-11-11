import { Reservation } from '../types';

/**
 * Generate QR code data string for a reservation
 * This creates a unique identifier that can be scanned at the event
 */
export const generateQRCodeData = (reservation: Reservation): string => {
  const qrData = {
    reservationId: reservation.id,
    userId: reservation.userId,
    reservationDate: reservation.reservationDate,
    stalls: reservation.stalls.map((s) => s.id),
    totalAmount: reservation.totalAmount,
  };
  return JSON.stringify(qrData);
};

/**
 * Generate a display-friendly QR code value
 * Format: CIBF-RES-{reservationId}-{date}
 */
export const generateQRCodeValue = (reservation: Reservation): string => {
  const dateStr = reservation.reservationDate.replace(/-/g, '');
  return `CIBF-RES-${reservation.id}-${dateStr}`;
};

