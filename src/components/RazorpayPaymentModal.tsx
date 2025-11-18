import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { CreditCard, Clock, X } from 'lucide-react';
import { paymentApi } from '../lib/api';
import { addDoc, collection, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingData: any; // Booking data to create
  currency?: string;
  onPaymentSuccess: (paymentStatus: 'paid' | 'due', paymentId?: string, orderId?: string, bookingId?: string) => void;
  onPaymentError?: (error: string) => void;
}

const RazorpayPaymentModal: React.FC<RazorpayPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  bookingData,
  currency = 'INR',
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Check if Razorpay script is loaded
  useEffect(() => {
    const checkRazorpay = () => {
      if (window.Razorpay) {
        setScriptLoaded(true);
      } else {
        // Retry after a short delay
        setTimeout(checkRazorpay, 100);
      }
    };
    checkRazorpay();
  }, []);

  // Reset createdBookingId when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCreatedBookingId(null);
    }
  }, [isOpen]);

  // Function to create booking in Firestore
  const createBooking = async () => {
    if (createdBookingId) {
      return createdBookingId; // Booking already created
    }

    try {
      // Create booking in main bookings collection
      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Also save a copy to user's bookings subcollection
      await addDoc(collection(db, 'users', bookingData.userId, 'bookings'), {
        ...bookingData,
        bookingId: bookingRef.id, // Reference to main booking
      });

      // Increment user's dueAmount since booking starts with paymentStatus 'due'
      const userRef = doc(db, 'users', bookingData.userId);
      await updateDoc(userRef, {
        dueAmount: increment(bookingData.totalAmount),
      });
      
      console.log('Booking created - dueAmount incremented:', {
        bookingId: bookingRef.id,
        amount: bookingData.totalAmount,
        paymentStatus: 'due'
      });

      setCreatedBookingId(bookingRef.id);
      return bookingRef.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking. Please try again.');
    }
  };

  const handlePayNow = async () => {
    if (!window.Razorpay || !scriptLoaded) {
      onPaymentError?.('Razorpay is loading. Please wait a moment and try again.');
      return;
    }

    setProcessing(true);
    try {
      // Create booking first
      const bookingId = await createBooking();

      // Create payment order via backend
      const orderResponse = await paymentApi.createPaymentOrder(bookingId, amount, currency);

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const { orderId, key, amount: orderAmount } = orderResponse.data;

      // Initialize Razorpay checkout
      const options = {
        key: key,
        amount: orderAmount,
        currency: currency,
        name: 'EasyMaid Cleaning Services',
        description: `Payment for Booking ${bookingId}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment with backend
            const verifyResponse = await paymentApi.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              bookingId
            );

            if (verifyResponse.success) {
              onPaymentSuccess('paid', response.razorpay_payment_id, response.razorpay_order_id, bookingId);
              onClose();
            } else {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            onPaymentError?.(error.message || 'Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#ff3c3c',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response);
        onPaymentError?.(response.error.description || 'Payment failed');
        setProcessing(false);
      });
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      onPaymentError?.(error.message || 'Failed to process payment');
      setProcessing(false);
    }
  };

  const handlePayLater = async () => {
    setLoading(true);
    try {
      // Create booking first
      const bookingId = await createBooking();

      // Mark as pay later (this is just for consistency, booking is already created with 'due' status)
      const response = await paymentApi.markPayLater(bookingId);

      if (response.success) {
        onPaymentSuccess('due', undefined, undefined, bookingId);
        onClose();
      } else {
        throw new Error(response.message || 'Failed to mark as pay later');
      }
    } catch (error: any) {
      console.error('Pay later error:', error);
      onPaymentError?.(error.message || 'Failed to process pay later request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Payment Options</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={processing || loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-2xl font-bold mt-2">
            {currency} {amount.toFixed(2)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            Choose your payment method for your booking
          </div>

          {/* Pay Now Button */}
          <Button
            onClick={handlePayNow}
            disabled={processing || loading || !scriptLoaded}
            className="w-full bg-gradient-to-r from-[#ff3c3c] to-[#ff9900] hover:opacity-90"
            size="lg"
          >
            {!scriptLoaded ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading Razorpay...
              </span>
            ) : processing ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing Payment...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pay Now via Razorpay
              </span>
            )}
          </Button>

          {/* Pay Later Button */}
          <Button
            onClick={handlePayLater}
            disabled={processing || loading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pay Later
              </span>
            )}
          </Button>

          <div className="text-xs text-center text-gray-500 mt-4">
            Your payment information is secure and encrypted
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RazorpayPaymentModal;

