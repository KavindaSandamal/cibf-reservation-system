import { useState, useEffect, useMemo } from 'react';
import { Stall, StallSize } from '../types';
import { toast } from 'react-toastify';

interface StallMapProps {
  onStallsSelect: (stalls: Stall[]) => void;
  selectedStallIds: number[];
  maxSelection?: number;
}

// Mock stall data for frontend-only development
const generateMockStalls = (): Stall[] => {
  const stalls: Stall[] = [];
  const locations = ['Hall A', 'Hall B', 'Hall C', 'Outdoor Area'];
  const sizes = [StallSize.SMALL, StallSize.MEDIUM, StallSize.LARGE];
  const prices = { [StallSize.SMALL]: 150, [StallSize.MEDIUM]: 300, [StallSize.LARGE]: 500 };

  let id = 1;
  locations.forEach((location, locIndex) => {
    const stallsPerLocation = locIndex === 3 ? 12 : 20; // Outdoor has fewer stalls
    for (let i = 1; i <= stallsPerLocation; i++) {
      const size = sizes[i % 3];
      const stallNumber = `${location.substring(0, 1)}${String(i).padStart(2, '0')}`;
      stalls.push({
        id: id++,
        stallNumber,
        stallName: `Stall ${stallNumber}`,
        location,
        size,
        price: prices[size],
        isAvailable: Math.random() > 0.2, // 80% available
        description: `${size} stall in ${location}`,
      });
    }
  });

  return stalls;
};

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

  // Load mock stalls on component mount
  useEffect(() => {
    const loadStalls = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockStalls = generateMockStalls();
      setStalls(mockStalls);
      setLoading(false);
    };
    loadStalls();
  }, []);

  // Filter stalls - MOVED BEFORE CONDITIONAL RETURN
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

  // Group stalls by location - MOVED BEFORE CONDITIONAL RETURN
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
      return 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/50';
    }
    if (hoveredStallId === stall.id) {
      return 'bg-amber-500 border-amber-400 shadow-lg';
    }
    if (!stall.isAvailable) {
      return 'bg-slate-700 border-slate-600 cursor-not-allowed opacity-60';
    }
    return 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500 cursor-pointer hover:shadow-lg transition-all';
  };

  const getStallSizeColor = (size: StallSize): string => {
    switch (size) {
      case StallSize.SMALL:
        return 'bg-blue-500 text-white';
      case StallSize.MEDIUM:
        return 'bg-purple-500 text-white';
      case StallSize.LARGE:
        return 'bg-orange-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  // Loading state - NOW AFTER ALL HOOKS
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500/30 border-t-indigo-400"></div>
          <p className="text-slate-300">Loading stalls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Search Stalls
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by stall number or name..."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-600/60 bg-slate-800/60 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>
          <div className="md:w-48">
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Filter by Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value as StallSize | 'ALL')}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-600/60 bg-slate-800/60 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
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
      <div className="rounded-2xl border-[3px] border-indigo-500/70 bg-indigo-500/10 p-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-indigo-200">
            Selected: {selectedStallIds.length} / {maxSelection} stalls
          </span>
          {selectedStallIds.length >= maxSelection && (
            <span className="text-sm text-amber-300 font-medium">
              Maximum selection reached
            </span>
          )}
        </div>
      </div>

      {/* Stall Map */}
      <div className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl ring-2 ring-slate-500/30">
        <h3 className="text-xl font-bold text-white mb-6">Stall Layout</h3>
        
        {Object.keys(stallGroups).length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            No stalls found matching your criteria.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(stallGroups).map(([location, locationStalls]) => (
              <div key={location}>
                {location !== 'Default' && (
                  <h4 className="text-lg font-semibold text-indigo-300 mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {location}
                  </h4>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {locationStalls.map((stall) => (
                    <div
                      key={stall.id}
                      className={`relative p-3 rounded-xl border-2 transition-all transform hover:scale-105 ${getStallColor(stall)}`}
                      onClick={() => handleStallClick(stall)}
                      onMouseEnter={() => setHoveredStallId(stall.id)}
                      onMouseLeave={() => setHoveredStallId(null)}
                      title={`${stall.stallName} - ${stall.size} - $${stall.price}`}
                    >
                      <div className="text-center">
                        <div className="font-bold text-white text-sm mb-1">
                          {stall.stallNumber}
                        </div>
                        <div className="text-xs text-white/90 mb-2">
                          {stall.stallName}
                        </div>
                        <div className={`text-xs font-bold ${getStallSizeColor(stall.size)} px-2 py-1 rounded-md mb-1`}>
                          {stall.size}
                        </div>
                        <div className="text-xs text-white mt-1 font-semibold">
                          ${stall.price}
                        </div>
                      </div>
                      {selectedStallIds.includes(stall.id) && (
                        <div className="absolute top-1 right-1">
                          <div className="rounded-full bg-white p-1 shadow-lg">
                            <svg
                              className="w-4 h-4 text-indigo-600"
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
                        </div>
                      )}
                      {!stall.isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl">
                          <span className="text-xs font-bold text-red-400">RESERVED</span>
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
      <div className="rounded-2xl border-[3px] border-slate-500/70 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl ring-2 ring-slate-500/30">
        <h4 className="text-sm font-semibold text-white mb-3">Legend</h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 border-2 border-emerald-500 rounded-lg"></div>
            <span className="text-slate-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 border-2 border-indigo-400 rounded-lg"></div>
            <span className="text-slate-300">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-700 border-2 border-slate-600 rounded-lg opacity-60"></div>
            <span className="text-slate-300">Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StallMap;


