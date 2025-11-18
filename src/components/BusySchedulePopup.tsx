import React from 'react';
import { X, Phone, Clock } from 'lucide-react';
import { Button } from './ui/button';

interface BusySchedulePopupProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const BusySchedulePopup: React.FC<BusySchedulePopupProps> = ({ 
  isOpen, 
  onClose, 
  message = "Busy schedule - contact service for checking availability" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        {/* Message */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Schedule Unavailable
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* Contact Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
            <Phone className="w-4 h-4" />
            <span>Contact our service team for availability</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            onClick={() => {
              // You can add phone number or contact action here
              window.open('tel:+1234567890', '_self');
            }}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusySchedulePopup;



