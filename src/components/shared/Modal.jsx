import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, variant = 'default' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // VARIANT STYLES
  const headerStyles = {
    default: "bg-white text-gray-800 border-b border-gray-100",
    urgent: "bg-red-600 text-white border-b border-red-700",
    warning: "bg-amber-500 text-white border-b border-amber-600",
    info: "bg-blue-600 text-white border-b border-blue-700"
  };

  const closeButtonStyles = {
    default: "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
    urgent: "text-white/80 hover:text-white hover:bg-red-700",
    warning: "text-white/80 hover:text-white hover:bg-amber-600",
    info: "text-white/80 hover:text-white hover:bg-blue-700"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Dynamic Header */}
        <div className={`flex items-center justify-between px-6 py-4 ${headerStyles[variant] || headerStyles.default}`}>
          <h2 className="text-lg font-bold tracking-wide flex items-center gap-2">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded-md transition-colors ${closeButtonStyles[variant] || closeButtonStyles.default}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;