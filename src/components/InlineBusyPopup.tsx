import React from 'react';
import { Clock, Phone, X } from 'lucide-react';

interface InlineBusyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const InlineBusyPopup: React.FC<InlineBusyPopupProps> = ({ 
  isOpen, 
  onClose, 
  message = "Today's schedule is busy - contact service for availability" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="mt-3">
      {/* Small inline popup */}
      <div className="bg-white border-2 border-orange-300 rounded-lg shadow-lg p-3 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Content */}
        <div className="flex items-start space-x-2 pr-6">
          {/* Icon */}
          <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="w-3 h-3 text-orange-600" />
          </div>
          
          {/* Message */}
          <div className="flex-1">
            <p className="text-xs text-gray-700 leading-relaxed">
              {message}
            </p>
            
            {/* Contact button */}
            <button
              onClick={() => {
                // You can customize the phone number here
                window.open('tel:+1234567890', '_self');
              }}
              className="mt-2 flex items-center space-x-1 text-xs text-orange-600 hover:text-orange-700 transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>Contact Service</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineBusyPopup;
