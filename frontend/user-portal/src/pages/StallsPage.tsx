import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StallMap from '../components/StallMap';
import { Stall } from '../types';

const StallsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStalls, setSelectedStalls] = useState<Stall[]>([]);

  const handleStallsSelect = (stalls: Stall[]) => {
    setSelectedStalls(stalls);
  };

  const handleProceedToBooking = () => {
    if (selectedStalls.length === 0) {
      return;
    }
    // Store selected stalls in sessionStorage to pass to booking page
    sessionStorage.setItem('selectedStalls', JSON.stringify(selectedStalls));
    navigate('/book');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Stalls</h1>
            <p className="mt-2 text-gray-600">
              Select up to 3 stalls for your reservation
            </p>
          </div>
          {selectedStalls.length > 0 && (
            <button
              onClick={handleProceedToBooking}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
            >
              Proceed to Booking ({selectedStalls.length})
            </button>
          )}
        </div>

        <StallMap
          onStallsSelect={handleStallsSelect}
          selectedStallIds={selectedStalls.map((s) => s.id)}
          maxSelection={3}
        />

        {selectedStalls.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selected Stalls ({selectedStalls.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedStalls.map((stall) => (
                <div
                  key={stall.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{stall.stallNumber}</h4>
                      <p className="text-sm text-gray-600">{stall.stallName}</p>
                    </div>
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded">
                      {stall.size}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">{stall.location}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">${stall.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-primary-600">
                  ${selectedStalls.reduce((sum, stall) => sum + stall.price, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StallsPage;


