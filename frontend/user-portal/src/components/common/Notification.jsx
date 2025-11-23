import React from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${
        notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } text-white`}>
        {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
        <span className="font-semibold">{notification.message}</span>
        <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
