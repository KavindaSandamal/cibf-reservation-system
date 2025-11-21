import React, { useState, useEffect } from 'react';
import { Download, Calendar, MapPin, DollarSign, Check, Clock, XCircle, Search, QrCode, Eye, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import reservationApi from '../../services/reservationApi';

const MyReservationsPage = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [qrCodes, setQrCodes] = useState({});
  const [loadingQR, setLoadingQR] = useState({});

  useEffect(() => {
    if (user?.id) fetchReservations();
  }, [user]);

  const fetchReservations = async () => {
    if (!user?.id) {
      showNotification('User not authenticated', 'error');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await reservationApi.get(`/api/reservations/user/${user.id}`);
      setReservations(response.data);
      setFilteredReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to load reservations';
      showNotification(errorMessage, 'error');
      setReservations([]);
      setFilteredReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    let filtered = reservations;
    if (searchTerm) {
      filtered = filtered.filter(res =>
        res.stallName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.reservationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(res => res.status === statusFilter);
    }
    setFilteredReservations(filtered);
  }, [searchTerm, statusFilter, reservations]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED': return { color: 'success', icon: Check };
      case 'PENDING': return { color: 'warning', icon: Clock };
      case 'CANCELLED': return { color: 'danger', icon: XCircle };
      default: return { color: 'secondary', icon: Clock };
    }
  };

  const getSizeLabel = (size) => size ? size.charAt(0) + size.slice(1).toLowerCase() : 'N/A';

  const fetchQRCode = async (reservationId, reservationCode) => {
    if (qrCodes[reservationId]) return qrCodes[reservationId];
    setLoadingQR(prev => ({ ...prev, [reservationId]: true }));

    try {
      // Trigger backend event (optional)
      await reservationApi.post('/api/test/rabbitmq/test-qr', {
        reservationId,
        qrData: `RESERVATION:${reservationId}:USER:${user.id}`
      });

      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`RESERVATION:${reservationId}:${reservationCode}`)}`;
      setQrCodes(prev => ({ ...prev, [reservationId]: qrApiUrl }));
      return qrApiUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      showNotification('Failed to generate QR code', 'error');
      return null;
    } finally {
      setLoadingQR(prev => ({ ...prev, [reservationId]: false }));
    }
  };

  const downloadQRCode = async (reservation) => {
    try {
      const qrUrl = await fetchQRCode(reservation.id, reservation.reservationCode);
      if (!qrUrl) return;

      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR_${reservation.reservationCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification('QR Code downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      showNotification('Failed to download QR code', 'error');
    }
  };

  const viewDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? This action cannot be undone.')) return;
    if (!user?.id) { showNotification('User not authenticated', 'error'); return; }

    setCancelling(true);
    try {
      await reservationApi.delete(`/api/reservations/${reservationId}`, { params: { userId: user.id } });
      showNotification('Reservation cancelled successfully', 'success');
      if (showDetailModal && selectedReservation?.id === reservationId) {
        setShowDetailModal(false);
        setSelectedReservation(null);
      }
      await fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to cancel reservation';
      showNotification(errorMessage, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return 'Invalid Date'; }
  };

  const handleModalClose = () => {
    if (cancelling) return;
    setShowDetailModal(false);
    setSelectedReservation(null);
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-secondary">Loading reservations...</h5>
      </div>
    </div>
  );

  return (
    <div className="bg-light" style={{ minHeight: '100vh', padding: '2rem 0' }}>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />

      {/* Notification Toast */}
      {notification && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`alert alert-${notification.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show d-flex align-items-center`} role="alert">
            {notification.type === 'success' ? <Check size={20} className="me-2" /> : <AlertCircle size={20} className="me-2" />}
            <div>{notification.message}</div>
            <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
          </div>
        </div>
      )}

      <div className="container-fluid px-4">
        {/* Header */}
        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div>
              <h1 className="h2 fw-bold mb-2">My Reservations</h1>
              <p className="text-muted mb-0">View and manage your stall reservations</p>
            </div>
            <div className="mt-3 mt-md-0">
              <span className="badge bg-primary fs-6 px-3 py-2">{filteredReservations.length} Reservation{filteredReservations.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-start border-5 border-secondary h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">Total</h6>
                <h2 className="fw-bold mb-0">{reservations.length}</h2>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-start border-5 border-success h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">Confirmed</h6>
                <h2 className="fw-bold text-success mb-0">{reservations.filter(r => r.status === 'CONFIRMED').length}</h2>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-start border-5 border-warning h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">Pending</h6>
                <h2 className="fw-bold text-warning mb-0">{reservations.filter(r => r.status === 'PENDING').length}</h2>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-start border-5 border-danger h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">Cancelled</h6>
                <h2 className="fw-bold text-danger mb-0">{reservations.filter(r => r.status === 'CANCELLED').length}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-8">
                <div className="input-group">
                  <span className="input-group-text bg-white"><Search size={18} /></span>
                  <input type="text" className="form-control" placeholder="Search by stall, reservation code, or company..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        <div className="row g-4">
          {filteredReservations.map(reservation => {
            const statusInfo = getStatusBadge(reservation.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={reservation.id} className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bold mb-1">{reservation.stallName || 'N/A'}</h5>
                        <p className="text-muted small mb-0">{reservation.reservationCode || 'N/A'}</p>
                      </div>
                      <span className={`badge bg-${statusInfo.color} d-flex align-items-center gap-1`}><StatusIcon size={14} />{reservation.status}</span>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2"><MapPin size={16} className="text-muted me-2" /><span className="small">{reservation.dimension || 'N/A'} • {getSizeLabel(reservation.size)}</span></div>
                      <div className="d-flex align-items-center mb-2"><Calendar size={16} className="text-muted me-2" /><span className="small">Reserved: {formatDate(reservation.reservationDate)}</span></div>
                      <div className="d-flex align-items-center"><DollarSign size={16} className="text-muted me-2" /><span className="fw-bold">${reservation.price || 0}</span></div>
                    </div>

                    <div className="mb-3 p-2 bg-light rounded">
                      <p className="small mb-1 fw-semibold">Company</p>
                      <p className="small mb-0">{reservation.companyName || 'N/A'}</p>
                    </div>

                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary btn-sm flex-fill" onClick={() => viewDetails(reservation)}><Eye size={16} className="me-1" />Details</button>
                      {reservation.status === 'CONFIRMED' && <button className="btn btn-primary btn-sm flex-fill" onClick={() => downloadQRCode(reservation)}><Download size={16} className="me-1" />QR</button>}
                      {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancelReservation(reservation.id)} disabled={cancelling} title="Cancel Reservation"><Trash2 size={16} /></button>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredReservations.length === 0 && !loading && (
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <QrCode size={64} className="text-muted mb-3" />
              <h5 className="text-muted">No reservations found</h5>
              <p className="text-muted small">{searchTerm || statusFilter !== 'ALL' ? 'Try adjusting your search or filters' : 'You have not made any reservations yet'}</p>
              {(searchTerm || statusFilter !== 'ALL') && <button className="btn btn-outline-primary mt-3" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}>Clear Filters</button>}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={handleModalClose}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Reservation Details</h5>
                <button type="button" className="btn-close" onClick={handleModalClose} disabled={cancelling}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    <div className="alert alert-primary mb-4">
                      <h5 className="fw-bold mb-2">{selectedReservation.stallName || 'N/A'}</h5>
                      <p className="mb-1 small"><strong>Reservation Code:</strong> {selectedReservation.reservationCode || 'N/A'}</p>
                      <span className={`badge bg-${getStatusBadge(selectedReservation.status).color}`}>{selectedReservation.status}</span>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-semibold mb-2">Stall Information</h6>
                      <div className="p-3 bg-light rounded">
                        <p className="mb-2"><strong>Dimensions:</strong> {selectedReservation.dimension || 'N/A'}</p>
                        <p className="mb-2"><strong>Size:</strong> {getSizeLabel(selectedReservation.size)}</p>
                        <p className="mb-0"><strong>Price:</strong> ${selectedReservation.price || 0}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-semibold mb-2">Vendor Information</h6>
                      <div className="p-3 bg-light rounded">
                        <p className="mb-2"><strong>Name:</strong> {selectedReservation.vendorName || 'N/A'}</p>
                        <p className="mb-2"><strong>Company:</strong> {selectedReservation.companyName || 'N/A'}</p>
                        <p className="mb-2"><strong>Email:</strong> {selectedReservation.vendorEmail || 'N/A'}</p>
                        <p className="mb-0"><strong>Phone:</strong> {selectedReservation.vendorPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-center">
                    <h6 className="fw-semibold mb-2">QR Code</h6>
                    {loadingQR[selectedReservation.id] ? (
                      <div className="spinner-border text-primary my-4" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      <img
                        src={qrCodes[selectedReservation.id] || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`RESERVATION:${selectedReservation.id}:${selectedReservation.reservationCode}`)}`}
                        alt="QR Code"
                        className="img-fluid border rounded"
                      />
                    )}
                    <button className="btn btn-primary btn-sm mt-3" onClick={() => downloadQRCode(selectedReservation)}>Download QR</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservationsPage;
