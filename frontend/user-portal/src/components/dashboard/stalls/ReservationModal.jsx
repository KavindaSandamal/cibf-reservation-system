import React from 'react';
import { X } from 'lucide-react';

const ReservationModal = ({ 
  isOpen,
  stall, 
  user,
  reservationForm,
  onFormChange,
  onSubmit, 
  onClose,
  submitting,
  holdToken,
  getSizeLabel 
}) => {
  if (!isOpen || !stall) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => !submitting && onClose()}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-2xl font-bold text-slate-800">Reserve Stall</h3>
          <button 
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
            <h4 className="text-xl font-bold text-indigo-900 mb-3">{stall.stallName}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-indigo-600 font-semibold">Dimensions</p>
                <p className="text-indigo-900 font-bold">{stall.dimension}</p>
              </div>
              <div>
                <p className="text-indigo-600 font-semibold">Size</p>
                <p className="text-indigo-900 font-bold">{getSizeLabel(stall.size)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-indigo-600 font-semibold">Price per Month</p>
                <p className="text-3xl font-bold text-indigo-900">${stall.price}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h5 className="font-bold text-blue-900 mb-3">Reservation Details</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-600 font-semibold">Business:</span>
                <span className="text-blue-900 font-bold">{user?.businessName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 font-semibold">Email:</span>
                <span className="text-blue-900 font-bold">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600 font-semibold">User ID:</span>
                <span className="text-blue-900 font-mono text-xs">{user?.id || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              rows="4"
              placeholder="Any special requirements or notes about your reservation..."
              value={reservationForm.notes}
              onChange={(e) => onFormChange({ notes: e.target.value })}
              disabled={submitting}
            ></textarea>
            <p className="text-xs text-slate-500 mt-1">These notes will be included in your reservation confirmation.</p>
          </div>

          {holdToken && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-sm font-bold text-green-900 mb-1">Hold Token Generated:</p>
              <p className="text-xs font-mono text-green-700 break-all">{holdToken}</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3 rounded-b-2xl">
          <button 
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              'Confirm Reservation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ReservationModal;