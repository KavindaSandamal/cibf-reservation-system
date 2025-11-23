import React from 'react';
import { Filter, Search } from 'lucide-react';

const StallFilters = ({ 
  searchTerm, 
  onSearchChange, 
  filterSize, 
  onSizeChange, 
  filterStatus, 
  onStatusChange 
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <Filter className="text-indigo-500" size={24} />
        <h3 className="text-xl font-bold text-slate-800">Filters</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search stalls..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2  text-black border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Size</label>
          <select
            value={filterSize}
            onChange={(e) => onSizeChange(e.target.value)}
            className="w-full  text-black px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="ALL">All Sizes</option>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full  text-black px-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default StallFilters;