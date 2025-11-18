import React from 'react';
import { Card, CardContent } from './ui/card';
import PaymentCard from './PaymentCard';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  userId?: string;
  bookingId?: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  amount,
  currency = 'AED',
  userId,
  bookingId,
  onPaymentSuccess,
  onPaymentError
}) => {
  if (!open) return null;

  const handlePaymentSuccess = (paymentData: any) => {
    onPaymentSuccess?.(paymentData);
    onClose();
  };

  const handlePaymentError = (error: string) => {
    onPaymentError?.(error);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-auto p-2 sm:p-4 relative">
        <CardContent>
          <button
            onClick={onClose}
            style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              background: 'none', 
              border: 'none', 
              fontSize: 22, 
              cursor: 'pointer', 
              color: '#888',
              zIndex: 10
            }}
            aria-label="Close"
          >
            ×
          </button>
          <PaymentCard
            amount={amount}
            currency={currency}
            userId={userId}
            bookingId={bookingId}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal; 