import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

import stallApi from '../../../services/stallApi';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';

// Other components
import StallStatistics from './StallStatistics';
import ViewModeToggle from './ViewModeToggle';
import StallFilters from './StallFilters';
import InteractiveStallMap from './InteractiveStallMap';
import StallTableView from './StallTableView';
import StallDetailsPanel from './StallDetailsPanel';
import ReservationModal from './ReservationModal';

const StallReservationSystem = () => {
  const { user } = useAuth();
  
  const [stalls, setStalls] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [selectedStall, setSelectedStall] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSize, setFilterSize] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('map');
  const [loading, setLoading] = useState(true);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationForm, setReservationForm] = useState({ notes: '' });
  const [notification, setNotification] = useState(null);
  const [holdToken, setHoldToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const userRole = user?.role || 'VENDOR';

  // Use useCallback to memoize fetchData function
  const fetchData = useCallback(async () => {
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
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user) {
      setReservationForm({ notes: '' });
    }
  }, [user]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleReserveStall = (stall) => {
    if (stall.status !== 'AVAILABLE') {
      showNotification('This stall is not available for reservation', 'error');
      return;
    }
    
    if (!user) {
      showNotification('Please log in to reserve a stall', 'error');
      return;
    }

    setSelectedStall(stall);
    setShowReservationModal(true);
    setReservationForm({ notes: '' });
    setHoldToken(null);
  };

  const handleSubmitReservation = async () => {
    if (!user || !user.id) {
      showNotification('User not authenticated. Please log in again.', 'error');
      return;
    }

    if (reservationForm.notes && reservationForm.notes.trim().length === 0) {
      showNotification('Please enter valid notes or leave it empty', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const holdResponse = await stallApi.post('/api/reservations/hold', {
        userId: user.id,
        stallIds: [selectedStall.id],
        businessName: user.businessName || 'Unknown Business'
      });

      const token = holdResponse.data.holdToken;
      setHoldToken(token);

      // Remove unused variable warning by not assigning to confirmResponse
      await stallApi.post('/api/reservations/confirm', {
        userId: user.id,
        holdToken: token,
        businessName: user.businessName || 'Unknown Business',
        userEmail: user.email || user.username,
        notes: reservationForm.notes || ''
      });
      
      showNotification(`Successfully reserved ${selectedStall.stallName}!`, 'success');
      
      setShowReservationModal(false);
      setSelectedStall(null);
      setHoldToken(null);
      setReservationForm({ notes: '' });
      
      await fetchData();
      
    } catch (error) {
      console.error('Error submitting reservation:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'Failed to submit reservation. Please try again.';
      showNotification(errorMessage, 'error');
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

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterSize('ALL');
    setFilterStatus('ALL');
  };

  const filteredStalls = stalls.filter(stall => {
    const matchesSearch =
      stall.stallName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stall.dimension?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSize = filterSize === 'ALL' || stall.size === filterSize;
    const matchesStatus = filterStatus === 'ALL' || stall.status === filterStatus;
    return matchesSearch && matchesSize && matchesStatus;
  });

  const getSizeLabel = (size) =>
    size ? size.charAt(0) + size.slice(1).toLowerCase() : 'N/A';

  if (loading) {
    return <LoadingSpinner message="Loading stalls" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <Notification 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Sparkles className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Stall Reservation System
                </h1>
                <p className="text-slate-600 mt-1">Find and reserve your perfect market stall</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 bg-indigo-50 rounded-xl">
                <p className="text-xs text-indigo-600 font-semibold">Logged in as</p>
                <p className="text-sm font-bold text-indigo-900">{user?.businessName || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-8">
        <StallStatistics statistics={statistics} />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ViewModeToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode} 
          />

          <div className="mt-6">
            {viewMode === 'map' ? (
              <InteractiveStallMap 
                stalls={filteredStalls} 
                onStallSelect={handleReserveStall}
                selectedStall={selectedStall}
                userRole={userRole}
              />
            ) : (
              <StallTableView 
                stalls={filteredStalls}
                onReserveStall={handleReserveStall}
                onUpdateStatus={handleUpdateStatus}
                userRole={userRole}
                getSizeLabel={getSizeLabel}
                onClearFilters={handleClearFilters}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <StallFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterSize={filterSize}
            onSizeChange={setFilterSize}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
          />

          {!showReservationModal && (
            <StallDetailsPanel
              selectedStall={selectedStall}
              onClose={() => setSelectedStall(null)}
              onReserve={() => setShowReservationModal(true)}
              userRole={userRole}
              getSizeLabel={getSizeLabel}
            />
          )}
        </div>
      </div>

      <ReservationModal
        isOpen={showReservationModal}
        stall={selectedStall}
        user={user}
        reservationForm={reservationForm}
        onFormChange={(updates) => setReservationForm({ ...reservationForm, ...updates })}
        onSubmit={handleSubmitReservation}
        onClose={() => {
          setShowReservationModal(false);
          setHoldToken(null);
        }}
        submitting={submitting}
        holdToken={holdToken}
        getSizeLabel={getSizeLabel}
      />
    </div>
  );
};

export default StallReservationSystem;