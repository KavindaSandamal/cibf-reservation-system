import React from 'react';
import { Filter } from 'lucide-react';

const StallTableView = ({ 
  stalls, 
  onReserveStall, 
  onUpdateStatus, 
  userRole, 
  getSizeLabel,
  onClearFilters 
}) => {
  if (stalls.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="text-center py-12">
          <Filter size={48} className="text-slate-300 mx-auto mb-3" />
          <h5 className="text-slate-500 font-semibold">No stalls found matching your filters</h5>
          <button 
            className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600"
            onClick={onClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Stall</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Dimensions</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Size</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Price</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {stalls.map((stall) => (
              <tr key={stall.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{stall.stallName}</td>
                <td className="px-6 py-4 text-slate-600">{stall.dimension}</td>
                <td className="px-6 py-4 text-slate-600">{getSizeLabel(stall.size)}</td>
                <td className="px-6 py-4 font-bold text-indigo-600">${stall.price}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    stall.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                    stall.status === 'RESERVED' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {stall.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {userRole === 'VENDOR' && stall.status === 'AVAILABLE' && (
                    <button
                      onClick={() => onReserveStall(stall)}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-colors"
                    >
                      Reserve
                    </button>
                  )}
                  {userRole === 'EMPLOYEE' && (
                    <div className="flex gap-2">
                      {stall.status !== 'AVAILABLE' && (
                        <button
                          onClick={() => onUpdateStatus(stall.id, 'AVAILABLE')}
                          className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600"
                        >
                          Available
                        </button>
                      )}
                      {stall.status !== 'RESERVED' && (
                        <button
                          onClick={() => onUpdateStatus(stall.id, 'RESERVED')}
                          className="px-3 py-1 bg-amber-500 text-white rounded text-xs font-semibold hover:bg-amber-600"
                        >
                          Reserve
                        </button>
                      )}
                      {stall.status !== 'UNAVAILABLE' && (
                        <button
                          onClick={() => onUpdateStatus(stall.id, 'UNAVAILABLE')}
                          className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold hover:bg-red-600"
                        >
                          Unavailable
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StallTableView;