import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { CreditCard, Clock, X } from 'lucide-react';
import { paymentApi } from '../lib/api';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Declare Stripe types
declare global {
  interface Window {
    Stripe: any;
  }
}

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingData: any; // Booking data to create
  currency?: string;
  onPaymentSuccess: (paymentStatus: 'paid' | 'due', paymentId?: string, orderId?: string, bookingId?: string) => void;
  onPaymentError?: (error: string) => void;
}

// Stripe Payment Form Component
const StripePaymentForm: React.FC<{
  bookingId: string;
  clientSecret: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}> = ({ bookingId, clientSecret, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      onError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Verify payment with backend
        const verifyResponse = await paymentApi.verifyPayment(
          paymentIntent.id,
          bookingId
        );

        if (verifyResponse.success) {
          onSuccess(paymentIntent.id);
        } else {
          throw new Error(verifyResponse.message || 'Payment verification failed');
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      onError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded-md">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-gradient-to-r from-[#ff3c3c] to-[#ff9900] hover:opacity-90"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pay Now
            </span>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  bookingData,
  currency = 'AED',
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Load Stripe
  useEffect(() => {
    const initStripe = async () => {
      try {
        // Get publishable key from backend when creating payment intent
        setStripePromise(null); // Will be set when payment intent is created
      } catch (error) {
        console.error('Error initializing Stripe:', error);
      }
    };
    initStripe();
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCreatedBookingId(null);
      setClientSecret(null);
      setShowPaymentForm(false);
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
    setProcessing(true);
    try {
      // Create booking first
      const bookingId = await createBooking();

      // Create payment intent via backend
      const orderResponse = await paymentApi.createPaymentOrder(bookingId, amount, currency);

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Failed to create payment intent');
      }

      const { clientSecret, publishableKey } = orderResponse.data;

      // Initialize Stripe with publishable key
      const stripe = await loadStripe(publishableKey);
      setStripePromise(stripe);
      setClientSecret(clientSecret);
      setShowPaymentForm(true);
      setProcessing(false);
    } catch (error: any) {
      console.error('Payment error:', error);
      onPaymentError?.(error.message || 'Failed to initialize payment');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    if (createdBookingId) {
      onPaymentSuccess('paid', paymentId, paymentId, createdBookingId);
      onClose();
    }
  };

  const handlePaymentError = (error: string) => {
    onPaymentError?.(error);
    setShowPaymentForm(false);
    setClientSecret(null);
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
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

          {/* Show Stripe Payment Form or Payment Buttons */}
          {showPaymentForm && clientSecret && stripePromise ? (
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                bookingId={createdBookingId!}
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </Elements>
          ) : (
            <>
              {/* Pay Now Button */}
              <Button
                onClick={handlePayNow}
                disabled={processing || loading}
                className="w-full bg-gradient-to-r from-[#ff3c3c] to-[#ff9900] hover:opacity-90"
                size="lg"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Initializing Payment...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Pay Now via Card
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
            </>
          )}

          <div className="text-xs text-center text-gray-500 mt-4">
            Your payment information is secure and encrypted
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripePaymentModal;

