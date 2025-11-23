import React, { useState, useEffect } from 'react';
import { Download, Calendar, MapPin, DollarSign, Check, XCircle, Search, QrCode, Eye, Trash2, AlertCircle, Edit, Building, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import reservationApi from '../../services/reservationApi';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../css/reservation.module.css';

const MyReservationsPage = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalData, setQRModalData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [updateForm, setUpdateForm] = useState({
    notes: '',
    status: ''
  });

  useEffect(() => {
    if (user?.id) fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchReservations = async () => {
    if (!user?.id) {
      showNotification('User not authenticated', 'error');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await reservationApi.get(`/api/reservations/user/${user.id}`);
      
      if (!Array.isArray(response.data)) {
        console.error('Response data is not an array:', response.data);
        showNotification('Invalid response format from server', 'error');
        setReservations([]);
        setFilteredReservations([]);
        return;
      }
      
      const transformedData = response.data.map((reservation) => {
        return {
          ...reservation,
          stallName: reservation.stalls?.[0]?.stallName || 'N/A',
          dimension: reservation.stalls?.[0]?.dimension || 'N/A',
          size: reservation.stalls?.[0]?.size || 'N/A',
          price: reservation.stalls?.[0]?.price || reservation.totalAmount || 0,
          reservationCode: `RES-${reservation.id}`,
          reservationDate: reservation.createdAt,
          companyName: reservation.businessName || 'N/A',
          vendorEmail: reservation.userEmail || 'N/A',
          vendorName: reservation.businessName || 'N/A',
          notes: reservation.notes || ''
        };
      });
      
      setReservations(transformedData);
      setFilteredReservations(transformedData);
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

  const showConfirmDialog = (message, onConfirm) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
          onConfirm();
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
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
      case 'CONFIRMED': return { color: 'success', icon: Check, label: 'Confirmed' };
      case 'CANCELLED': return { color: 'danger', icon: XCircle, label: 'Cancelled' };
      default: return { color: 'secondary', icon: Check, label: status };
    }
  };

  const getSizeLabel = (size) => {
    if (!size) return 'N/A';
    return size.charAt(0).toUpperCase() + size.slice(1).toLowerCase();
  };

  const openQRModal = (reservation) => {
    setQRModalData(reservation);
    setShowQRModal(true);
  };

  const downloadQRCodeDirect = (qrUrl, filename) => {
    try {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('QR Code download started - check your downloads folder', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      showNotification('Please right-click the QR code and select "Save Image As"', 'info');
    }
  };

  const viewDetails = (reservation) => {
    console.log('Viewing details for reservation:', reservation);
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const openUpdateModal = (reservation) => {
    setSelectedReservation(reservation);
    setUpdateForm({
      notes: reservation.notes || '',
      status: reservation.status || 'CONFIRMED'
    });
    setShowUpdateModal(true);
  };

  const handleUpdateReservation = async () => {
    if (!selectedReservation) return;
    
    if (updateForm.status === 'CANCELLED') {
      showConfirmDialog(
        'Are you sure you want to cancel this reservation? This action cannot be undone.',
        async () => {
          setUpdating(true);
          showNotification('Processing cancellation...', 'info');
          
          try {
            await reservationApi.delete(`/api/reservations/${selectedReservation.id}`, { 
              params: { userId: user.id } 
            });
            showNotification('✓ Reservation cancelled successfully!', 'success');
            setShowUpdateModal(false);
            setSelectedReservation(null);
            await fetchReservations();
          } catch (error) {
            console.error('Error cancelling reservation:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to cancel reservation';
            showNotification(`✗ ${errorMessage}`, 'error');
          } finally {
            setUpdating(false);
          }
        }
      );
      return;
    }
    
    setUpdating(true);
    showNotification('Updating reservation...', 'info');
    
    try {
      await reservationApi.put(`/api/reservations/${selectedReservation.id}`, updateForm);
      showNotification('✓ Reservation updated successfully!', 'success');
      setShowUpdateModal(false);
      setSelectedReservation(null);
      await fetchReservations();
    } catch (error) {
      console.error('Error updating reservation:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update reservation';
      showNotification(`✗ ${errorMessage}`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    showConfirmDialog(
      'Are you sure you want to cancel this reservation? This action cannot be undone.',
      async () => {
        if (!user?.id) { 
          showNotification('✗ User not authenticated', 'error'); 
          return; 
        }

        setCancelling(true);
        showNotification('Processing cancellation...', 'info');
        
        try {
          await reservationApi.delete(`/api/reservations/${reservationId}`, { params: { userId: user.id } });
          showNotification('✓ Reservation cancelled successfully!', 'success');
          if (showDetailModal && selectedReservation?.id === reservationId) {
            setShowDetailModal(false);
            setSelectedReservation(null);
          }
          await fetchReservations();
        } catch (error) {
          console.error('Error cancelling reservation:', error);
          const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to cancel reservation';
          showNotification(`✗ ${errorMessage}`, 'error');
        } finally {
          setCancelling(false);
        }
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { 
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }); 
    }
    catch { return 'Invalid Date'; }
  };

  const handleModalClose = () => {
    if (cancelling || updating) return;
    setShowDetailModal(false);
    setShowUpdateModal(false);
    setShowQRModal(false);
    setSelectedReservation(null);
    setQRModalData(null);
  };

  if (loading)  {
    return <LoadingSpinner message='loading reservations'/>
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 0', backgroundColor: '#f8f9fa' }}>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />

      {notification && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`alert alert-${
            notification.type === 'success' ? 'success' : 
            notification.type === 'info' ? 'info' : 
            'danger'
          } alert-dismissible fade show d-flex align-items-center shadow-lg border-0`} role="alert">
            {notification.type === 'success' ? <Check size={20} className="me-2" /> : 
             notification.type === 'info' ? <AlertCircle size={20} className="me-2" /> :
             <AlertCircle size={20} className="me-2" />}
            <div><strong>{notification.message}</strong></div>
            <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div 
          className="modal d-block text-black" 
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-2">
                <h5 className="modal-title fw-bold d-flex align-items-center">
                  <AlertCircle size={24} className="me-2 text-warning" />
                  Confirm Action
                </h5>
              </div>
              <div className="modal-body pb-2">
                <p className="mb-0">{confirmDialog.message}</p>
              </div>
              <div className="modal-footer border-0 pt-2">
                <button 
                  type="button" 
                  className="btn btn-light px-4" 
                  onClick={confirmDialog.onCancel}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger px-4" 
                  onClick={confirmDialog.onConfirm}
                >
                  <Trash2 size={16} className="me-2" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container-fluid px-4">
        {/* Header */}
        <div className="card shadow-sm mb-4 border-0">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div>
                <h1 className="h2 fw-bold mb-2" style={{ color: '#1e293b' }}>My Reservations</h1>
                <p className="text-muted mb-0">Manage and track all your stall bookings</p>
              </div>
              <div className="mt-3 mt-md-0">
                <span className="badge bg-primary fs-5 px-4 py-2 rounded-pill">
                  {filteredReservations.length} Total
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 text-uppercase small fw-semibold">Active Bookings</p>
                    <h2 className="fw-bold mb-0" style={{ color: '#10b981' }}>
                      {reservations.filter(r => r.status === 'CONFIRMED').length}
                    </h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ backgroundColor: '#d1fae5' }}>
                    <Check size={32} style={{ color: '#10b981' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-muted mb-1 text-uppercase small fw-semibold">Cancelled</p>
                    <h2 className="fw-bold mb-0" style={{ color: '#ef4444' }}>
                      {reservations.filter(r => r.status === 'CANCELLED').length}
                    </h2>
                  </div>
                  <div className="rounded-circle p-3" style={{ backgroundColor: '#fee2e2' }}>
                    <XCircle size={32} style={{ color: '#ef4444' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-4 border-0">
          <div className="card-body p-4">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-8">
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-white border-end-0">
                    <Search size={20} className="text-muted" />
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-start-0 ps-0" 
                    placeholder="Search reservations..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <select 
                  className="form-select form-select-lg" 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ fontSize: '1rem' }}
                >
                  <option value="ALL">All Status</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>
          </div>
        </div>

       
        {/* Confirmed Reservations - Cards */}
        {filteredReservations.filter(r => r.status === 'CONFIRMED').length > 0 && (
          <>
            <div className="mb-3">
              <h4 className="fw-bold" style={{ color: '#1e293b' }}>
                <Check size={24} className="me-2 text-success" />
                Active Reservations
              </h4>
            </div>
            <div className="row g-4 mb-5">
              {filteredReservations.filter(r => r.status === 'CONFIRMED').map(reservation => {
                const statusInfo = getStatusBadge(reservation.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div key={reservation.id} className="col-12 col-md-6 col-xl-4">
                    <div className="card shadow-sm h-100 border-0 reservation-card">
                      <div className="card-body p-4">
                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="flex-grow-1">
                            <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>
                              {reservation.stallName}
                            </h5>
                            <p className="text-muted small mb-0">
                              <code className="bg-light px-2 py-1 rounded">{reservation.reservationCode}</code>
                            </p>
                          </div>
                          <span className={`badge bg-${statusInfo.color} d-flex align-items-center gap-1 ms-2`}>
                            <StatusIcon size={14} />{statusInfo.label}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="mb-3">
                          <div className="d-flex align-items-start mb-2">
                            <MapPin size={18} className="text-primary me-2 mt-1 flex-shrink-0" />
                            <span className="small">
                              <strong>{reservation.dimension}</strong> • {getSizeLabel(reservation.size)}
                            </span>
                          </div>
                          <div className="d-flex align-items-start mb-2">
                            <Calendar size={18} className="text-primary me-2 mt-1 flex-shrink-0" />
                            <span className="small">{formatDate(reservation.reservationDate)}</span>
                          </div>
                          <div className="d-flex align-items-start">
                            <DollarSign size={18} className="text-primary me-2 mt-1 flex-shrink-0" />
                            <span className="fw-bold fs-5" style={{ color: '#10b981' }}>
                              ${reservation.price}
                            </span>
                          </div>
                        </div>

                        {/* Company Info */}
                        <div className="mb-3 p-3 rounded" style={{ backgroundColor: '#f1f5f9' }}>
                          <div className="d-flex align-items-center mb-2">
                            <Building size={16} className="text-muted me-2" />
                            <span className="small text-muted fw-semibold">COMPANY</span>
                          </div>
                          <p className="mb-0 fw-medium">{reservation.companyName}</p>
                        </div>

                        {/* Actions */}
                        <div className="d-flex gap-2 flex-wrap">
                          <button 
                            className="btn btn-outline-primary btn-sm flex-fill" 
                            onClick={() => viewDetails(reservation)}
                          >
                            <Eye size={16} className="me-1" />View
                          </button>
                          {reservation.qrCodeUrl && (
                            <button 
                              className="btn btn-primary btn-sm flex-fill" 
                              onClick={() => openQRModal(reservation)}
                            >
                              <QrCode size={16} className="me-1" />QR
                            </button>
                          )}
                          <button 
                            className="btn btn-outline-secondary btn-sm" 
                            onClick={() => openUpdateModal(reservation)} 
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm" 
                            onClick={() => handleCancelReservation(reservation.id)} 
                            disabled={cancelling}
                            title="Cancel"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Other Reservations - Table */}
        {filteredReservations.filter(r => r.status !== 'CONFIRMED').length > 0 && (
          <>
            <div className="mb-3">
              <h4 className="fw-bold" style={{ color: '#1e293b' }}>
                <FileText size={24} className="me-2 text-muted" />
                Other Reservations
              </h4>
            </div>
            <div className="card shadow-sm border-0">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th className="px-4 py-3 fw-semibold">Stall Name</th>
                        <th className="px-4 py-3 fw-semibold">Code</th>
                        <th className="px-4 py-3 fw-semibold">Company</th>
                        <th className="px-4 py-3 fw-semibold">Date</th>
                        <th className="px-4 py-3 fw-semibold">Price</th>
                        <th className="px-4 py-3 fw-semibold">Status</th>
                        <th className="px-4 py-3 fw-semibold text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.filter(r => r.status !== 'CONFIRMED').map(reservation => {
                        const statusInfo = getStatusBadge(reservation.status);
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <tr key={reservation.id}>
                            <td className="px-4 py-3">
                              <div className="fw-semibold">{reservation.stallName}</div>
                              <div className="small text-muted">{reservation.dimension}</div>
                            </td>
                            <td className="px-4 py-3">
                              <code className="bg-light px-2 py-1 rounded">{reservation.reservationCode}</code>
                            </td>
                            <td className="px-4 py-3">{reservation.companyName}</td>
                            <td className="px-4 py-3">
                              <div className="small">{formatDate(reservation.reservationDate)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="fw-bold" style={{ color: '#10b981' }}>
                                ${reservation.price}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge bg-${statusInfo.color} d-flex align-items-center gap-1`} style={{ width: 'fit-content' }}>
                                <StatusIcon size={14} />{statusInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="d-flex gap-2 justify-content-end">
                                <button 
                                  className="btn btn-sm btn-outline-primary" 
                                  onClick={() => viewDetails(reservation)}
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div 
          className="modal d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} 
          onClick={handleModalClose}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg" 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0" style={{ backgroundColor: '#f8fafc' }}>
                <div>
                  <h5 className="modal-title fw-bold mb-1">Reservation Details</h5>
                  <p className="text-muted small mb-0">Complete information about your booking</p>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleModalClose} 
                  disabled={cancelling}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  <div className="col-md-7">
                    <div className={`alert alert-${getStatusBadge(selectedReservation.status).color} border-0 mb-4`}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h5 className="fw-bold mb-2">{selectedReservation.stallName}</h5>
                          <p className="mb-0 small">
                            <strong>Code:</strong> <code>{selectedReservation.reservationCode}</code>
                          </p>
                        </div>
                        <span className={`badge bg-${getStatusBadge(selectedReservation.status).color} fs-6 px-3 py-2`}>
                          {getStatusBadge(selectedReservation.status).label}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#1e293b' }}>
                        <MapPin size={20} className="me-2 text-primary" />
                        Stall Information
                      </h6>
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <div className="row g-3">
                            <div className="col-6">
                              <p className="text-muted small mb-1">Dimensions</p>
                              <p className="fw-semibold mb-0">{selectedReservation.dimension}</p>
                            </div>
                            <div className="col-6">
                              <p className="text-muted small mb-1">Size Category</p>
                              <p className="fw-semibold mb-0">{getSizeLabel(selectedReservation.size)}</p>
                            </div>
                            <div className="col-6">
                              <p className="text-muted small mb-1">Total Price</p>
                              <p className="fw-bold mb-0 fs-5" style={{ color: '#10b981' }}>
                                ${selectedReservation.price}
                              </p>
                            </div>
                            <div className="col-6">
                              <p className="text-muted small mb-1">Booked On</p>
                              <p className="fw-semibold mb-0 small">
                                {formatDate(selectedReservation.reservationDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h6 className="fw-bold mb-3 d-flex align-items-center" style={{ color: '#1e293b' }}>
                        <Building size={20} className="me-2 text-primary" />
                        Business Details
                      </h6>
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <div className="mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <Building size={16} className="text-muted me-2" />
                              <span className="text-muted small">Company Name</span>
                            </div>
                            <p className="fw-semibold mb-0 ms-4">{selectedReservation.companyName}</p>
                          </div>
                          {selectedReservation.notes && (
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <FileText size={16} className="text-muted me-2" />
                                <span className="text-muted small">Additional Notes</span>
                              </div>
                              <p className="mb-0 ms-4 small text-muted fst-italic">
                                {selectedReservation.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-5">
                    <div className="text-center sticky-top" style={{ top: '1rem' }}>
                      <h6 className="fw-bold mb-3">Access QR Code</h6>
                      {selectedReservation.qrCodeUrl ? (
                        <>
                          <div className="card border-0 shadow-sm mb-3">
                            <div className="card-body p-3">
                              <img
                                src={selectedReservation.qrCodeUrl}
                                alt="Reservation QR Code"
                                className="img-fluid rounded"
                                style={{ maxWidth: '250px', cursor: 'pointer' }}
                                onClick={() => openQRModal(selectedReservation)}
                              />
                            </div>
                          </div>
                          <button 
                            className="btn btn-primary w-100 mb-2" 
                            onClick={() => openQRModal(selectedReservation)}
                          >
                            <QrCode size={18} className="me-2" />
                            View Full Size
                          </button>
                          <button 
                            className="btn btn-outline-primary w-100" 
                            onClick={() => downloadQRCodeDirect(
                              selectedReservation.qrCodeUrl,
                              `reservation-${selectedReservation.reservationCode}-qrcode.png`
                            )}
                          >
                            <Download size={18} className="me-2" />
                            Download QR Code
                          </button>
                          <p className="text-muted small mt-3 mb-0">
                            Use this QR code for entry verification
                          </p>
                        </>
                      ) : (
                        <div className="card border-0 shadow-sm">
                          <div className="card-body text-center py-5">
                            <QrCode size={48} className="text-muted mb-3 opacity-50" />
                            <p className="text-muted small mb-0">QR Code not available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedReservation && (
        <div 
          className="modal d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} 
          onClick={handleModalClose}
        >
          <div 
            className="modal-dialog modal-dialog-centered" 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{ backgroundColor: '#f8fafc' }}>
                <div>
                  <h5 className="modal-title fw-bold mb-1">Update Reservation</h5>
                  <p className="text-muted small mb-0">Modify status and notes</p>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleModalClose} 
                  disabled={updating}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-black">
                    Reservation Status
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={updateForm.status}
                    onChange={e => setUpdateForm({...updateForm, status: e.target.value})}
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-black">Additional Notes</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    value={updateForm.notes}
                    onChange={e => setUpdateForm({...updateForm, notes: e.target.value})}
                    placeholder="Add any special requirements or notes..."
                  ></textarea>
                </div>
                <div className="alert alert-info border-0 d-flex align-items-start">
                  <AlertCircle size={20} className="me-2 mt-1 flex-shrink-0" />
                  <small>Update the reservation status or add/modify notes for your booking.</small>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  className="btn btn-light" 
                  onClick={handleModalClose} 
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleUpdateReservation} 
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check size={18}  />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && qrModalData && (
        <div 
          className="modal d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} 
          onClick={handleModalClose}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg" 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{ backgroundColor: '#f8fafc' }}>
                <div>
                  <h5 className="modal-title fw-bold mb-1">QR Code - {qrModalData.stallName}</h5>
                  <p className="text-muted small mb-0">
                    <code>{qrModalData.reservationCode}</code>
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleModalClose}
                ></button>
              </div>
              
              <div className="modal-body p-5 text-center">
                <div className="mb-4">
                  <img
                    src={qrModalData.qrCodeUrl}
                    alt="Full Size QR Code"
                    className="img-fluid rounded shadow-lg"
                    style={{ maxWidth: '400px', width: '100%' }}
                  />
                </div>
                
                <div className="alert alert-info border-0 mb-4">
                  <div className="d-flex align-items-start">
                    <AlertCircle size={20} className="me-2 mt-1 flex-shrink-0" />
                    <div className="text-start">
                      <strong className="d-block mb-1">How to use this QR Code:</strong>
                      <small>
                        Present this QR code at the venue entrance for verification. 
                        You can download it for offline access or screenshot it for convenience.
                      </small>
                    </div>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-primary btn-lg" 
                    onClick={() => downloadQRCodeDirect(
                      qrModalData.qrCodeUrl,
                      `reservation-${qrModalData.reservationCode}-qrcode.png`
                    )}
                  >
                    <Download size={20} className="me-2" />
                    Download QR Code
                  </button>
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={handleModalClose}
                  >
                    Close
                  </button>
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
