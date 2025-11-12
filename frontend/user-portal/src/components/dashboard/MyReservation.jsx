import React, { useState, useEffect, useRef } from 'react';
import { Download, Calendar, MapPin, DollarSign, Check, Clock, XCircle, Search, QrCode, Eye } from 'lucide-react';

const MyReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const qrRef = useRef(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock reservations data
      const mockReservations = [
        {
          id: 1,
          reservationCode: 'RES-2024-001',
          stallName: 'Stall A1',
          vendorName: 'Tech Solutions Inc.',
          vendorEmail: 'contact@techsolutions.com',
          vendorPhone: '+1 234 567 8900',
          companyName: 'Tech Solutions Inc.',
          dimension: '3m x 3m',
          size: 'SMALL',
          price: 500,
          reservationDate: '2024-12-15',
          bookingDate: '2024-11-10',
          status: 'CONFIRMED',
          notes: 'Need power outlet and WiFi',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        },
        {
          id: 2,
          reservationCode: 'RES-2024-002',
          stallName: 'Stall B5',
          vendorName: 'Fashion World',
          vendorEmail: 'info@fashionworld.com',
          vendorPhone: '+1 234 567 8901',
          companyName: 'Fashion World Ltd.',
          dimension: '4m x 4m',
          size: 'MEDIUM',
          price: 750,
          reservationDate: '2024-12-20',
          bookingDate: '2024-11-12',
          status: 'PENDING',
          notes: 'Display mannequins required',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        },
        {
          id: 3,
          reservationCode: 'RES-2024-003',
          stallName: 'Stall C10',
          vendorName: 'Food Paradise',
          vendorEmail: 'hello@foodparadise.com',
          vendorPhone: '+1 234 567 8902',
          companyName: 'Food Paradise Co.',
          dimension: '5m x 5m',
          size: 'LARGE',
          price: 1200,
          reservationDate: '2024-12-18',
          bookingDate: '2024-11-08',
          status: 'CONFIRMED',
          notes: 'Water connection needed',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        },
        {
          id: 4,
          reservationCode: 'RES-2024-004',
          stallName: 'Stall D3',
          vendorName: 'Book Haven',
          vendorEmail: 'support@bookhaven.com',
          vendorPhone: '+1 234 567 8903',
          companyName: 'Book Haven Publishing',
          dimension: '3m x 3m',
          size: 'SMALL',
          price: 500,
          reservationDate: '2024-12-22',
          bookingDate: '2024-11-13',
          status: 'CANCELLED',
          notes: 'Cancelled due to scheduling conflict',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        }
      ];
      
      setReservations(mockReservations);
      setFilteredReservations(mockReservations);
      setLoading(false);
    };
    
    fetchReservations();
  }, []);

  // Filter reservations
  useEffect(() => {
    let filtered = reservations;
    
    if (searchTerm) {
      filtered = filtered.filter(res => 
        res.stallName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.reservationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(res => res.status === statusFilter);
    }
    
    setFilteredReservations(filtered);
  }, [searchTerm, statusFilter, reservations]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { color: 'success', icon: Check };
      case 'PENDING':
        return { color: 'warning', icon: Clock };
      case 'CANCELLED':
        return { color: 'danger', icon: XCircle };
      default:
        return { color: 'secondary', icon: Clock };
    }
  };

  const getSizeLabel = (size) => {
    return size ? size.charAt(0) + size.slice(1).toLowerCase() : 'N/A';
  };

  const generateQRCode = (reservationCode) => {
    // In a real application, use a QR code library like qrcode.react or qrcode
    // For now, returning a placeholder SVG
    const qrSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="20" height="20" fill="black"/>
        <rect x="60" y="20" width="20" height="20" fill="black"/>
        <rect x="100" y="20" width="20" height="20" fill="black"/>
        <rect x="140" y="20" width="20" height="20" fill="black"/>
        <rect x="20" y="60" width="20" height="20" fill="black"/>
        <rect x="140" y="60" width="20" height="20" fill="black"/>
        <rect x="20" y="100" width="20" height="20" fill="black"/>
        <rect x="60" y="100" width="20" height="20" fill="black"/>
        <rect x="100" y="100" width="20" height="20" fill="black"/>
        <rect x="140" y="100" width="20" height="20" fill="black"/>
        <rect x="20" y="140" width="20" height="20" fill="black"/>
        <rect x="60" y="140" width="20" height="20" fill="black"/>
        <rect x="100" y="140" width="20" height="20" fill="black"/>
        <rect x="140" y="140" width="20" height="20" fill="black"/>
        <text x="100" y="190" text-anchor="middle" font-size="12" fill="black">${reservationCode}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(qrSvg)}`;
  };

  const downloadQRCode = (reservation) => {
    const qrCodeData = generateQRCode(reservation.reservationCode);
    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `QR_${reservation.reservationCode}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-secondary">Loading reservations...</h5>
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
      
      <div className="container-fluid px-4">
        {/* Header */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
              <div>
                <h1 className="h2 fw-bold mb-2">My Reservations</h1>
                <p className="text-muted mb-0">View and manage your stall reservations</p>
              </div>
              <div className="mt-3 mt-md-0">
                <span className="badge bg-primary fs-6 px-3 py-2">
                  {filteredReservations.length} Reservation{filteredReservations.length !== 1 ? 's' : ''}
                </span>
              </div>
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
                <h2 className="fw-bold text-success mb-0">
                  {reservations.filter(r => r.status === 'CONFIRMED').length}
                </h2>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-start border-5 border-warning h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">Pending</h6>
                <h2 className="fw-bold text-warning mb-0">
                  {reservations.filter(r => r.status === 'PENDING').length}
                </h2>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card shadow-sm border-start border-5 border-danger h-100">
              <div className="card-body">
                <h6 className="text-muted small mb-1">Cancelled</h6>
                <h2 className="fw-bold text-danger mb-0">
                  {reservations.filter(r => r.status === 'CANCELLED').length}
                </h2>
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
                  <span className="input-group-text bg-white">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by stall, reservation code, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-12 col-md-4">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
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
          {filteredReservations.map((reservation) => {
            const statusInfo = getStatusBadge(reservation.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div key={reservation.id} className="col-12 col-md-6 col-lg-4">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bold mb-1">{reservation.stallName}</h5>
                        <p className="text-muted small mb-0">{reservation.reservationCode}</p>
                      </div>
                      <span className={`badge bg-${statusInfo.color} d-flex align-items-center gap-1`}>
                        <StatusIcon size={14} />
                        {reservation.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <MapPin size={16} className="text-muted me-2" />
                        <span className="small">
                          {reservation.dimension} • {getSizeLabel(reservation.size)}
                        </span>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <Calendar size={16} className="text-muted me-2" />
                        <span className="small">Reserved: {reservation.reservationDate}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <DollarSign size={16} className="text-muted me-2" />
                        <span className="fw-bold">${reservation.price}</span>
                      </div>
                    </div>

                    <div className="mb-3 p-2 bg-light rounded">
                      <p className="small mb-1 fw-semibold">Company</p>
                      <p className="small mb-0">{reservation.companyName}</p>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-primary btn-sm flex-fill"
                        onClick={() => viewDetails(reservation)}
                      >
                        <Eye size={16} className="me-1" />
                        Details
                      </button>
                      {reservation.status === 'CONFIRMED' && (
                        <button
                          className="btn btn-primary btn-sm flex-fill"
                          onClick={() => downloadQRCode(reservation)}
                        >
                          <Download size={16} className="me-1" />
                          QR Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredReservations.length === 0 && (
          <div className="card shadow-sm">
            <div className="card-body text-center py-5">
              <QrCode size={64} className="text-muted mb-3" />
              <h5 className="text-muted">No reservations found</h5>
              <p className="text-muted small">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div 
          className="modal d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Reservation Details</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    <div className="alert alert-primary mb-4">
                      <h5 className="fw-bold mb-2">{selectedReservation.stallName}</h5>
                      <p className="mb-1 small">
                        <strong>Reservation Code:</strong> {selectedReservation.reservationCode}
                      </p>
                      <span className={`badge bg-${getStatusBadge(selectedReservation.status).color}`}>
                        {selectedReservation.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-semibold mb-2">Stall Information</h6>
                      <div className="p-3 bg-light rounded">
                        <p className="mb-2"><strong>Dimensions:</strong> {selectedReservation.dimension}</p>
                        <p className="mb-2"><strong>Size:</strong> {getSizeLabel(selectedReservation.size)}</p>
                        <p className="mb-0"><strong>Price:</strong> ${selectedReservation.price}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-semibold mb-2">Vendor Information</h6>
                      <div className="p-3 bg-light rounded">
                        <p className="mb-2"><strong>Name:</strong> {selectedReservation.vendorName}</p>
                        <p className="mb-2"><strong>Company:</strong> {selectedReservation.companyName}</p>
                        <p className="mb-2"><strong>Email:</strong> {selectedReservation.vendorEmail}</p>
                        <p className="mb-0"><strong>Phone:</strong> {selectedReservation.vendorPhone}</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6 className="fw-semibold mb-2">Dates</h6>
                      <div className="p-3 bg-light rounded">
                        <p className="mb-2"><strong>Booking Date:</strong> {selectedReservation.bookingDate}</p>
                        <p className="mb-0"><strong>Reservation Date:</strong> {selectedReservation.reservationDate}</p>
                      </div>
                    </div>

                    {selectedReservation.notes && (
                      <div className="mb-3">
                        <h6 className="fw-semibold mb-2">Notes</h6>
                        <div className="p-3 bg-light rounded">
                          <p className="mb-0">{selectedReservation.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <div className="text-center">
                      <h6 className="fw-semibold mb-3">QR Code</h6>
                      <div className="p-3 bg-light rounded mb-3">
                        <img 
                          src={generateQRCode(selectedReservation.reservationCode)} 
                          alt="QR Code"
                          className="img-fluid"
                          style={{ maxWidth: '200px' }}
                        />
                      </div>
                      {selectedReservation.status === 'CONFIRMED' && (
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => downloadQRCode(selectedReservation)}
                        >
                          <Download size={16} className="me-2" />
                          Download QR Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservationsPage;