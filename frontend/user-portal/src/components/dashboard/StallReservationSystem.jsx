import React, { useState, useEffect } from 'react';
import { Search, MapPin, List, Filter, X, Check, AlertCircle, Calendar, DollarSign, Maximize2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import stallApi from '../../services/stallApi';


const StallReservationSystem = () => {
  const { user } = useAuth();
  
  const [stalls, setStalls] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSize, setSelectedSize] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('table');
  const [selectedStall, setSelectedStall] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    vendorName: user?.businessName || '',
    vendorEmail: user?.email || '',
    vendorPhone: '',
    companyName: user?.businessName || '',
    reservationDate: '',
    notes: ''
  });
  const [notification, setNotification] = useState(null);
  const [holdToken, setHoldToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const userRole = user?.role || 'VENDOR';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      setReservationForm(prev => ({
        ...prev,
        vendorName: user.businessName || '',
        vendorEmail: user.email || '',
        companyName: user.businessName || ''
      }));
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const stallsRes = await stallApi.get('/api/stalls');
      const stallsData = stallsRes.data;

      setStalls(stallsData);

      const stats = {
        totalStalls: stallsData.length,
        availableStalls: stallsData.filter(s => s.status === 'AVAILABLE').length,
        reservedStalls: stallsData.filter(s => s.status === 'RESERVED').length,
        unavailableStalls: stallsData.filter(s => s.status === 'UNAVAILABLE').length,
        occupancyRate: (
          (stallsData.filter(s => s.status === 'RESERVED').length / stallsData.length) *
          100
        ).toFixed(1),
      };
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Failed to load stalls', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleReserveStall = (stall) => {
    if (stall.status !== 'AVAILABLE') {
      showNotification('This stall is not available for reservation', 'error');
      return;
    }
    
    if (!user?.id) {
      showNotification('Please log in to reserve a stall', 'error');
      return;
    }

    setSelectedStall(stall);
    setShowReservationModal(true);
    setReservationForm({
      vendorName: user?.businessName || '',
      vendorEmail: user?.email || '',
      vendorPhone: '',
      companyName: user?.businessName || '',
      reservationDate: '',
      notes: ''
    });
    setHoldToken(null);
  };

  const handleSubmitReservation = async () => {
    // Validation
    if (!reservationForm.vendorName || !reservationForm.vendorEmail || 
        !reservationForm.vendorPhone || !reservationForm.reservationDate) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    if (!user?.id) {
      showNotification('User not authenticated', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reservationForm.vendorEmail)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    // Phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(reservationForm.vendorPhone)) {
      showNotification('Please enter a valid phone number', 'error');
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Hold the stall
      const holdResponse = await stallApi.post('/api/reservations/hold', {
        userId: user.id,
        stallIds: [selectedStall.id]
      });

      const token = holdResponse.data.holdToken;
      setHoldToken(token);

      // Step 2: Confirm the reservation
      await stallApi.post('/api/reservations/confirm', {
        userId: user.id,
        holdToken: token,
        vendorName: reservationForm.vendorName,
        vendorEmail: reservationForm.vendorEmail,
        vendorPhone: reservationForm.vendorPhone,
        companyName: reservationForm.companyName,
        reservationDate: reservationForm.reservationDate,
        notes: reservationForm.notes
      });
      
      showNotification(`Successfully reserved ${selectedStall.stallName}!`, 'success');
      setShowReservationModal(false);
      setSelectedStall(null);
      setHoldToken(null);
      setReservationForm({
        vendorName: user?.businessName || '',
        vendorEmail: user?.email || '',
        vendorPhone: '',
        companyName: user?.businessName || '',
        reservationDate: '',
        notes: ''
      });
      
      // Refresh stall data
      await fetchData();
    } catch (error) {
      console.error('Error submitting reservation:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to submit reservation. Please try again.';
      showNotification(errorMessage, 'error');
      
      // Clear hold token on error
      setHoldToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change the status to ${status}?`)) {
      return;
    }

    try {
      await stallApi.patch(`/api/stalls/${id}/status`, null, {
        params: { status }
      });
      showNotification('Status updated successfully', 'success');
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to update status';
      showNotification(errorMessage, 'error');
    }
  };

  const filteredStalls = stalls.filter(stall => {
    const matchesSearch =
      stall.stallName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stall.dimension?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSize = selectedSize === 'ALL' || stall.size === selectedSize;
    const matchesStatus = selectedStatus === 'ALL' || stall.status === selectedStatus;
    return matchesSearch && matchesSize && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'RESERVED':
        return 'primary';
      case 'UNAVAILABLE':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getSizeLabel = (size) =>
    size ? size.charAt(0) + size.slice(1).toLowerCase() : 'N/A';

  const handleModalClose = () => {
    if (submitting) return;
    setShowReservationModal(false);
    setSelectedStall(null);
    setHoldToken(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-secondary">Loading stalls...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light" style={{ minHeight: '100vh', padding: '2rem 0' }}>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      
      {/* Notification Toast */}
      {notification && (
        <div 
          className="position-fixed top-0 end-0 p-3" 
          style={{ zIndex: 9999 }}
        >
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
          <div className="card-body">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div>
                <h1 className="h2 fw-bold mb-2">Stall Management</h1>
                <p className="text-muted mb-0">Browse and reserve exhibition stalls</p>
              </div>
              <div className="d-flex align-items-center bg-primary bg-opacity-10 px-3 py-2 rounded mt-3 mt-md-0">
                <span className="badge bg-primary rounded-pill me-2">&nbsp;</span>
                <span className="small fw-semibold text-primary">Live Availability</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4 col-lg">
              <div className="card shadow-sm border-start border-5 border-secondary h-100">
                <div className="card-body">
                  <h6 className="text-muted small mb-1">Total Stalls</h6>
                  <h2 className="fw-bold mb-0">{statistics.totalStalls}</h2>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg">
              <div className="card shadow-sm border-start border-5 border-success h-100">
                <div className="card-body">
                  <h6 className="text-muted small mb-1">Available</h6>
                  <h2 className="fw-bold text-success mb-0">{statistics.availableStalls}</h2>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg">
              <div className="card shadow-sm border-start border-5 border-primary h-100">
                <div className="card-body">
                  <h6 className="text-muted small mb-1">Reserved</h6>
                  <h2 className="fw-bold text-primary mb-0">{statistics.reservedStalls}</h2>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg">
              <div className="card shadow-sm border-start border-5 border-danger h-100">
                <div className="card-body">
                  <h6 className="text-muted small mb-1">Unavailable</h6>
                  <h2 className="fw-bold text-danger mb-0">{statistics.unavailableStalls}</h2>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg">
              <div className="card shadow-sm border-start border-5 border-info h-100">
                <div className="card-body">
                  <h6 className="text-muted small mb-1">Occupancy</h6>
                  <h2 className="fw-bold text-info mb-0">{statistics.occupancyRate}%</h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search stalls..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-6 col-md-2">
                <select
                  className="form-select"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                >
                  <option value="ALL">All Sizes</option>
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
              </div>

              <div className="col-6 col-md-2">
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </select>
              </div>

              <div className="col-12 col-md-4">
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('table')}
                  >
                    <List size={18} className="me-1" /> Table
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewMode('map')}
                  >
                    <MapPin size={18} className="me-1" /> Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3 fw-semibold">Stall</th>
                      <th className="px-4 py-3 fw-semibold">Dimensions</th>
                      <th className="px-4 py-3 fw-semibold">Size</th>
                      <th className="px-4 py-3 fw-semibold">Price</th>
                      <th className="px-4 py-3 fw-semibold">Status</th>
                      <th className="px-4 py-3 fw-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStalls.map((stall) => (
                      <tr key={stall.id}>
                        <td className="px-4 py-3">
                          <span className="fw-bold">{stall.stallName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center">
                            <Maximize2 size={16} className="text-muted me-2" />
                            {stall.dimension}
                          </div>
                        </td>
                        <td className="px-4 py-3">{getSizeLabel(stall.size)}</td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center fw-bold">
                            <DollarSign size={16} />
                            {stall.price}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge bg-${getStatusBadge(stall.status)}`}>
                            {stall.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex gap-2">
                            {userRole === 'VENDOR' && stall.status === 'AVAILABLE' && (
                              <button
                                onClick={() => handleReserveStall(stall)}
                                className="btn btn-primary btn-sm"
                              >
                                Reserve
                              </button>
                            )}
                            
                            {userRole === 'EMPLOYEE' && (
                              <div className="btn-group btn-group-sm">
                                {stall.status !== 'AVAILABLE' && (
                                  <button
                                    onClick={() => handleUpdateStatus(stall.id, 'AVAILABLE')}
                                    className="btn btn-outline-success"
                                    title="Mark as Available"
                                  >
                                    Available
                                  </button>
                                )}
                                {stall.status !== 'RESERVED' && (
                                  <button
                                    onClick={() => handleUpdateStatus(stall.id, 'RESERVED')}
                                    className="btn btn-outline-primary"
                                    title="Mark as Reserved"
                                  >
                                    Reserve
                                  </button>
                                )}
                                {stall.status !== 'UNAVAILABLE' && (
                                  <button
                                    onClick={() => handleUpdateStatus(stall.id, 'UNAVAILABLE')}
                                    className="btn btn-outline-danger"
                                    title="Mark as Unavailable"
                                  >
                                    Unavailable
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredStalls.length === 0 && (
                <div className="text-center py-5">
                  <Filter size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No stalls found matching your filters</h5>
                  <button 
                    className="btn btn-outline-primary mt-3"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSize('ALL');
                      setSelectedStatus('ALL');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0 fw-bold">Floor Map</h4>
                <div className="d-flex gap-3">
                  <div className="d-flex align-items-center">
                    <span className="badge bg-success me-2">&nbsp;&nbsp;</span>
                    <small>Available</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-primary me-2">&nbsp;&nbsp;</span>
                    <small>Reserved</small>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-danger me-2">&nbsp;&nbsp;</span>
                    <small>Unavailable</small>
                  </div>
                </div>
              </div>
              
              <div 
                className="position-relative border border-2 rounded bg-light overflow-hidden"
                style={{ height: '600px' }}
              >
                {filteredStalls.length > 0 ? (
                  filteredStalls.map((stall) => (
                    <div
                      key={stall.id}
                      onClick={() => stall.status === 'AVAILABLE' && userRole === 'VENDOR' && handleReserveStall(stall)}
                      className={`position-absolute rounded shadow d-flex flex-column align-items-center justify-content-center text-white fw-bold ${
                        stall.status === 'AVAILABLE' ? 'bg-success' : stall.status === 'RESERVED' ? 'bg-primary' : 'bg-danger'
                      }`}
                      style={{
                        left: `${stall.locationX}%`,
                        top: `${stall.locationY}%`,
                        width: '80px',
                        height: '80px',
                        transform: 'translate(-50%, -50%)',
                        cursor: stall.status === 'AVAILABLE' && userRole === 'VENDOR' ? 'pointer' : 'default',
                        transition: 'transform 0.2s'
                      }}
                      title={`${stall.stallName} - ${stall.status} - $${stall.price} - ${stall.dimension}`}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
                    >
                      <div style={{ fontSize: '1rem' }}>{stall.stallName}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>${stall.price}</div>
                    </div>
                  ))
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center">
                      <MapPin size={48} className="text-muted mb-3" />
                      <h5 className="text-muted">No stalls to display on map</h5>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reservation Modal */}
      {showReservationModal && selectedStall && (
        <div 
          className="modal d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={handleModalClose}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Reserve Stall</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={handleModalClose}
                  disabled={submitting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-primary mb-4">
                  <h5 className="fw-bold mb-2">{selectedStall.stallName}</h5>
                  <div className="small">
                    <p className="mb-1"><strong>Dimensions:</strong> {selectedStall.dimension}</p>
                    <p className="mb-1"><strong>Size:</strong> {getSizeLabel(selectedStall.size)}</p>
                    <p className="mb-0 fs-5 fw-bold text-primary mt-2">${selectedStall.price}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Vendor Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter vendor name"
                    value={reservationForm.vendorName}
                    onChange={(e) => setReservationForm({...reservationForm, vendorName: e.target.value})}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="form-control"
                    value={reservationForm.vendorEmail}
                    onChange={(e) => setReservationForm({...reservationForm, vendorEmail: e.target.value})}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="form-control"
                    value={reservationForm.vendorPhone}
                    onChange={(e) => setReservationForm({...reservationForm, vendorPhone: e.target.value})}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Company Name</label>
                  <input
                    type="text"
                    placeholder="Enter your company name"
                    className="form-control"
                    value={reservationForm.companyName}
                    onChange={(e) => setReservationForm({...reservationForm, companyName: e.target.value})}
                    disabled={submitting}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Reservation Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={reservationForm.reservationDate}
                    onChange={(e) => setReservationForm({...reservationForm, reservationDate: e.target.value})}
                    disabled={submitting}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Additional Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Any special requirements or notes"
                    value={reservationForm.notes}
                    onChange={(e) => setReservationForm({...reservationForm, notes: e.target.value})}
                    disabled={submitting}
                  ></textarea>
                </div>

                {holdToken && (
                  <div className="alert alert-info">
                    <small>Hold Token: {holdToken}</small>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleModalClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSubmitReservation}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    'Confirm Reservation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StallReservationSystem;