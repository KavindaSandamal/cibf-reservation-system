import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { stallService } from '../services/stallService';
import { Stall, StallSize } from '../types';
import { toast } from 'react-toastify';
import StallDetailModal from '../components/StallDetailModal';

const StallsOverviewPage: React.FC = () => {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');
  const [sizeFilter, setSizeFilter] = useState<StallSize | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadStalls();
  }, []);

  const loadStalls = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (availabilityFilter !== 'ALL') {
        filters.status = availabilityFilter === 'AVAILABLE' ? 'AVAILABLE' : 'RESERVED';
      }
      if (sizeFilter !== 'ALL') {
        filters.size = sizeFilter;
      }
      const data = await stallService.getAllStalls(filters);
      setStalls(data);
    } catch (error: any) {
      toast.error('Failed to load stalls');
      console.error('Error loading stalls:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload when filters change
  useEffect(() => {
    loadStalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityFilter, sizeFilter]);

  const handleViewStall = (stall: Stall) => {
    setSelectedStall(stall);
    setIsModalOpen(true);
  };

  // Filter stalls by search query (client-side for now, since backend filtering is by status/size)
  const filteredStalls = useMemo(() => {
    return stalls.filter((stall) => {
      const matchesSearch =
        searchQuery === '' ||
        stall.stallNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stall.stallName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stall.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [stalls, searchQuery]);

  const sizeColors = {
    [StallSize.SMALL]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    [StallSize.MEDIUM]: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    [StallSize.LARGE]: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-300">Loading stalls...</p>
          </div>
        </div>
      </div>
    );
  }

  const availableCount = stalls.filter((s) => s.isAvailable).length;
  const unavailableCount = stalls.filter((s) => !s.isAvailable).length;
  const occupancyRate = stalls.length > 0 ? ((unavailableCount / stalls.length) * 100).toFixed(1) : '0';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-1/4 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.800)_1px,transparent_1px)] [background-size:18px_18px] opacity-30" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Stalls Overview
          </h1>
          <p className="text-slate-400">View and manage all stalls</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border-2 border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="text-sm font-medium text-slate-400 mb-1">Total Stalls</div>
            <div className="text-3xl font-bold text-white">{stalls.length}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="text-sm font-medium text-slate-400 mb-1">Available</div>
            <div className="text-3xl font-bold text-emerald-400">{availableCount}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border-2 border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="text-sm font-medium text-slate-400 mb-1">Occupancy Rate</div>
            <div className="text-3xl font-bold text-cyan-400">{occupancyRate}%</div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 rounded-2xl border-2 border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by stall number, name, or location..."
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Availability</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as 'ALL' | 'AVAILABLE' | 'UNAVAILABLE')}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="ALL">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Size</label>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value as StallSize | 'ALL')}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="ALL">All Sizes</option>
                <option value={StallSize.SMALL}>Small</option>
                <option value={StallSize.MEDIUM}>Medium</option>
                <option value={StallSize.LARGE}>Large</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Stalls Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredStalls.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              No stalls found
            </div>
          ) : (
            filteredStalls.map((stall) => (
              <motion.div
                key={stall.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => handleViewStall(stall)}
                className="rounded-2xl border-2 border-slate-700/70 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl hover:border-indigo-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{stall.stallNumber}</h3>
                    <p className="text-sm text-slate-400">{stall.stallName}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      stall.isAvailable
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {stall.isAvailable ? 'Available' : 'Reserved'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Location</span>
                    <span className="text-sm font-medium text-white">{stall.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Size</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${sizeColors[stall.size]}`}>
                      {stall.size}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Price</span>
                    <span className="text-sm font-bold text-white">${stall.price.toLocaleString()}</span>
                  </div>
                  {stall.description && (
                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-xs text-slate-400">{stall.description}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Stall Detail Modal */}
      {selectedStall && (
        <StallDetailModal
          stall={selectedStall}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStall(null);
          }}
        />
      )}
    </div>
  );
};

export default StallsOverviewPage;
