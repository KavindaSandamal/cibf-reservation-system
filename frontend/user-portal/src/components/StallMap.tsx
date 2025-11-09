import { useState, useEffect, useMemo } from 'react';
import { Stall, StallSize } from '../types';
import { stallService } from '../services/stallService';
import { toast } from 'react-toastify';

interface StallMapProps {
  onStallsSelect: (stalls: Stall[]) => void;
  selectedStallIds: number[];
  maxSelection?: number;
}

const StallMap: React.FC<StallMapProps> = ({
  onStallsSelect,
  selectedStallIds,
  maxSelection = 3,
}) => {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<StallSize | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredStallId, setHoveredStallId] = useState<number | null>(null);

  useEffect(() => {
    loadStalls();
  }, []);

  const loadStalls = async () => {
    try {
      setLoading(true);
      const data = await stallService.getAvailableStalls();
      setStalls(data);
    } catch (error: any) {
      toast.error('Failed to load stalls: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredStalls = useMemo(() => {
    return stalls.filter((stall) => {
      const matchesSize = selectedSize === 'ALL' || stall.size === selectedSize;
      const matchesSearch =
        searchTerm === '' ||
        stall.stallNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stall.stallName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSize && matchesSearch;
    });
  }, [stalls, selectedSize, searchTerm]);

  const handleStallClick = (stall: Stall) => {
    if (!stall.isAvailable) {
      toast.warning('This stall is not available');
      return;
    }

    const isSelected = selectedStallIds.includes(stall.id);
    let newSelection: number[];

    if (isSelected) {
      // Deselect
      newSelection = selectedStallIds.filter((id) => id !== stall.id);
    } else {
      // Check if we've reached the limit
      if (selectedStallIds.length >= maxSelection) {
        toast.warning(`You can only select up to ${maxSelection} stalls`);
        return;
      }
      // Select
      newSelection = [...selectedStallIds, stall.id];
    }

    const selectedStalls = stalls.filter((s) => newSelection.includes(s.id));
    onStallsSelect(selectedStalls);
  };

  const getStallColor = (stall: Stall): string => {
    if (selectedStallIds.includes(stall.id)) {
      return 'bg-blue-500 border-blue-700';
    }
    if (hoveredStallId === stall.id) {
      return 'bg-yellow-400 border-yellow-600';
    }
    if (!stall.isAvailable) {
      return 'bg-red-300 border-red-500 cursor-not-allowed';
    }
    return 'bg-green-400 border-green-600 hover:bg-green-500 cursor-pointer';
  };

  const getStallSizeColor = (size: StallSize): string => {
    switch (size) {
      case StallSize.SMALL:
        return 'text-blue-600';
      case StallSize.MEDIUM:
        return 'text-purple-600';
      case StallSize.LARGE:
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Group stalls by location or create a grid layout
  const stallGroups = useMemo(() => {
    const groups: { [key: string]: Stall[] } = {};
    filteredStalls.forEach((stall) => {
      const groupKey = stall.location || 'Default';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(stall);
    });
    return groups;
  }, [filteredStalls]);

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Stalls
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by stall number or name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value as StallSize | 'ALL')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="ALL">All Sizes</option>
              <option value={StallSize.SMALL}>Small</option>
              <option value={StallSize.MEDIUM}>Medium</option>
              <option value={StallSize.LARGE}>Large</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selection Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            Selected: {selectedStallIds.length} / {maxSelection} stalls
          </span>
          {selectedStallIds.length >= maxSelection && (
            <span className="text-sm text-blue-700">
              Maximum selection reached
            </span>
          )}
        </div>
      </div>

      {/* Stall Map */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stall Layout</h3>
        
        {Object.keys(stallGroups).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No stalls found matching your criteria.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(stallGroups).map(([location, locationStalls]) => (
              <div key={location}>
                {location !== 'Default' && (
                  <h4 className="text-md font-medium text-gray-700 mb-3">{location}</h4>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {locationStalls.map((stall) => (
                    <div
                      key={stall.id}
                      className={`relative p-4 rounded-lg border-2 transition-all ${getStallColor(stall)}`}
                      onClick={() => handleStallClick(stall)}
                      onMouseEnter={() => setHoveredStallId(stall.id)}
                      onMouseLeave={() => setHoveredStallId(null)}
                      title={`${stall.stallName} - ${stall.size} - $${stall.price}`}
                    >
                      <div className="text-center">
                        <div className="font-bold text-white text-sm mb-1">
                          {stall.stallNumber}
                        </div>
                        <div className="text-xs text-white opacity-90 mb-1">
                          {stall.stallName}
                        </div>
                        <div className={`text-xs font-semibold ${getStallSizeColor(stall)} bg-white px-2 py-1 rounded`}>
                          {stall.size}
                        </div>
                        <div className="text-xs text-white mt-1 font-semibold">
                          ${stall.price}
                        </div>
                      </div>
                      {selectedStallIds.includes(stall.id) && (
                        <div className="absolute top-1 right-1">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-400 border-2 border-green-600 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 border-2 border-blue-700 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-300 border-2 border-red-500 rounded"></div>
            <span>Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StallMap;


