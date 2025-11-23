import React from 'react';
import { MapPin, List } from 'lucide-react';

const ViewModeToggle = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">View Mode</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'map'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MapPin size={18} /> Map View
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <List size={18} /> Table View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewModeToggle;