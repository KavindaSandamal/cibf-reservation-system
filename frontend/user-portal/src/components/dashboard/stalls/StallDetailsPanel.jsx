import React from 'react';
import { MapPin, Maximize2, DollarSign, XCircle, Eye } from 'lucide-react';

const StallDetailsPanel = ({ selectedStall, onClose, onReserve, userRole, getSizeLabel }) => {
  if (!selectedStall) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 text-center">
        <Eye className="mx-auto text-slate-300 mb-4" size={48} />
        <p className="text-slate-600 font-medium">
          Click on any stall in the map to view details
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-2xl text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold">Stall Details</h3>
        <button 
          onClick={onClose}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
        >
          <XCircle size={20} />
        </button>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
          <MapPin size={20} />
          <div>
            <p className="text-xs text-indigo-200">Stall Number</p>
            <p className="font-bold text-lg">{selectedStall.stallName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
          <Maximize2 size={20} />
          <div>
            <p className="text-xs text-indigo-200">Size & Dimensions</p>
            <p className="font-bold">{getSizeLabel(selectedStall.size)} - {selectedStall.dimension}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
          <DollarSign size={20} />
          <div>
            <p className="text-xs text-indigo-200">Price per Month</p>
            <p className="font-bold text-2xl">${selectedStall.price}</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3">
          <p className="text-xs text-indigo-200 mb-1">Status</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
            selectedStall.status === 'AVAILABLE' ? 'bg-green-500' :
            selectedStall.status === 'RESERVED' ? 'bg-amber-500' : 'bg-red-500'
          }`}>
            {selectedStall.status}
          </span>
        </div>
      </div>

      {selectedStall.status === 'AVAILABLE' && userRole === 'VENDOR' && (
        <button
          onClick={onReserve}
          className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          Reserve This Stall
        </button>
      )}
    </div>
  );
};

export default StallDetailsPanel;