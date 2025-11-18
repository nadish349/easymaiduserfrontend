import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar as CalendarPicker } from './ui/calendar';
import { Calendar, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { createBookingConfirmationNotification } from '../lib/notifications';
import RoutineRequest from './RoutineRequest';
import RazorpayPaymentModal from './RazorpayPaymentModal';
import { useCoupons } from '@/hooks/useCoupons';
import { CouponSelector } from './CouponSelector';
import { bookingApi } from '../lib/api';


interface BookingSummaryProps {
  selectedHours: number;
  selectedProfessionals: number;
  needMaterials: boolean;
  instructions: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  timeOptions: string[];
  hourlyRate: number;
  materialFee: number;
  calculateTotal: () => number;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (time: string | null) => void;
  toast: (args: unknown) => void;
  authProfile: unknown;
  setSelectedHours: (hours: number) => void;
  setSelectedProfessionals: (count: number) => void;
  setNeedMaterials: (need: boolean) => void;
  setInstructions: (instructions: string) => void;
  setShowOTP: (show: boolean) => void;
  isBookingGloballyDisabled: boolean;
  isTodayBlocked: boolean;
  isDateAvailable: (date: Date) => boolean;
  areTimeSlotsAvailable: (date: Date | null) => boolean;
  availabilityLoading: boolean;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedHours,
  selectedProfessionals,
  needMaterials,
  instructions,
  selectedDate,
  selectedTime,
  timeOptions,
  hourlyRate,
  materialFee,
  calculateTotal,
  setSelectedDate,
  setSelectedTime,
  toast,
  authProfile,
  setSelectedHours,
  setSelectedProfessionals,
  setNeedMaterials,
  setInstructions,
  setShowOTP,
  isBookingGloballyDisabled,
  isTodayBlocked,
  isDateAvailable,
  areTimeSlotsAvailable,
  availabilityLoading,
}) => {
  const [showRoutineCleaning, setShowRoutineCleaning] = useState(false);
  const [showRoutineRequest, setShowRoutineRequest] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);

  const baseTotal = calculateTotal();
  
  const {
    availableCoupons,
    loading: couponsLoading,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalAmount,
  } = useCoupons(selectedHours, baseTotal);

  const discountAmount = getDiscountAmount();
  const finalTotal = appliedCoupon ? getFinalAmount() : baseTotal;

  // Fetch settings to check if routine cleaning should be shown
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'weekly-monthly-service'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setShowRoutineCleaning(data.status === true);
        } else {
          setShowRoutineCleaning(false);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setShowRoutineCleaning(false);
      }
    };

    fetchSettings();
  }, []);


  return (
    <>
      <Card
        className="w-full max-w-md mx-auto lg:sticky lg:top-8 lg:mr-20 mt-1"
        style={{
          height: 'auto',
          border: '3px solid transparent',
          borderRadius: '12px',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #ff3c3c, #ff9900) border-box',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
      <CardHeader>
        <div className="w-full bg-black py-2 rounded-t-lg flex justify-center items-center">
          <span className="text-white text-lg sm:text-xl font-bold text-center">Booking Summary</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Payment Summary */}
        <div className="space-y-2 text-xs sm:text-sm">
          <h4 className="font-medium text-sm sm:text-base">Payment Summary</h4>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Service ({selectedHours}h × {selectedProfessionals} professionals)
            </span>
            <span>AED {hourlyRate * selectedHours * selectedProfessionals}</span>
          </div>
          {needMaterials && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Materials</span>
              <span>AED {materialFee}</span>
            </div>
          )}
          {appliedCoupon && discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="font-medium">Discount ({appliedCoupon.code})</span>
              <span>- AED {discountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
        <Separator />
        {/* Total Price */}
        <div className="flex justify-between font-semibold text-base sm:text-lg">
          <span>Total Price:</span>
          <span className={appliedCoupon ? 'text-green-600' : ''}>
            AED {finalTotal.toFixed(2)}
          </span>
        </div>
        {appliedCoupon && discountAmount > 0 && (
          <div className="text-xs text-muted-foreground text-right">
            Original: AED {baseTotal.toFixed(2)}
          </div>
        )}
        <Separator />
        {/* Booking Details */}
        <div className="space-y-3">
          <h4 className="text-base sm:text-lg font-medium">Booking Details</h4>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Service:</span>
            <span className="font-medium">Home Cleaning</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{selectedHours} hours</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Number of Professionals:</span>
            <span className="font-medium">{selectedProfessionals}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Materials:</span>
            <span className="font-medium">{needMaterials ? 'Yes' : 'No'}</span>
          </div>
          {instructions && (
            <div className="flex flex-col">
              <span className="text-muted-foreground">Instructions:</span>
              <span className="font-medium break-words whitespace-pre-line">
                {instructions}
              </span>
            </div>
          )}
          <Separator />
          {/* Instructions input just above Confirm Booking */}
          <div className="mb-2">
            <h3 className="text-xs sm:text-sm font-medium mb-1 mt-2">Any instructions or special requirements?</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Key under the mat, ironing, window cleaning, etc."
                value={instructions}
                onChange={e => setInstructions(e.target.value.slice(0, 150))}
                className="w-full border rounded px-2 py-1 text-xs sm:text-sm"
                maxLength={150}
                style={{ minHeight: 0, height: '2.2em', resize: 'none' }}
              />
              <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
                {instructions.length}/150
              </div>
            </div>
          </div>
          <button
            type="button"
            className="px-4 sm:px-6 py-2 rounded-full font-bold text-white text-sm sm:text-base shadow-md w-full sm:w-auto"
            style={{
              background: 'linear-gradient(90deg, #ff3c3c, #ff9900)',
              border: 'none',
              outline: 'none',
              maxWidth: '100%',
              minWidth: '200px',
              transition: 'box-shadow 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: '0 auto',
              display: 'block',
              marginTop: '0.5cm'
            }}
            onClick={async () => {
              // Set loading state
              setIsBookingLoading(true);
              
              try {
                // Check booking availability first
                if (isBookingGloballyDisabled) {
                  toast({
                    title: "Booking Unavailable",
                    description: "Booking service is currently disabled. Please try again later.",
                    variant: "destructive",
                  });
                  setIsBookingLoading(false);
                  return;
                }

                if (selectedDate && !isDateAvailable(selectedDate)) {
                  toast({
                    title: "Date Unavailable",
                    description: "The selected date is not available for booking.",
                    variant: "destructive",
                  });
                  setIsBookingLoading(false);
                  return;
                }

                if (!areTimeSlotsAvailable(selectedDate)) {
                  toast({
                    title: "Time Slots Unavailable",
                    description: "Time slots are not available for the selected date.",
                    variant: "destructive",
                  });
                  setIsBookingLoading(false);
                  return;
                }

                // Additional safety check - ensure we have the latest availability data
                if (availabilityLoading) {
                  toast({
                    title: "Please Wait",
                    description: "Loading availability information. Please try again in a moment.",
                    variant: "destructive",
                  });
                  setIsBookingLoading(false);
                  return;
                }

                // Validate date and time selection
                if (!selectedDate || !selectedTime) {
                  toast({
                    title: "Date and Time Required",
                    description: "Please select both date and time for your booking.",
                    variant: "destructive",
                  });
                  setIsBookingLoading(false);
                  return;
                }

                // Create a combined date-time object
                const selectedDateTime = new Date(selectedDate);
                const [hours] = selectedTime.split(':').map(Number);
                selectedDateTime.setHours(hours, 0, 0, 0);

                // Check if the selected date-time is in the past
                const now = new Date();
                if (selectedDateTime <= now) {
                  toast({
                    title: "Invalid Date/Time",
                    description: "Please select a future date and time for your booking.",
                    variant: "destructive",
                  });
                  setIsBookingLoading(false);
                  return;
                }

                // Check if user is logged in
                if (!authProfile) {
                  setIsBookingLoading(false);
                  setShowOTP(true); // Show OTP modal
                  return;
                }

                // Final safety check before saving to Firestore
                if (isBookingGloballyDisabled || (selectedDate && !isDateAvailable(selectedDate))) {
                  toast({
                    title: "Booking Unavailable",
                    description: "The selected booking is not available.",
                    variant: "destructive",
                  });
                  setIsBookingLoading(false);
                  return;
                }

                // Prepare booking data (but don't create it yet)
                // Booking will be created when user clicks "Pay Now" or "Pay Later"
                  const bookingData = {
                    userId: (authProfile as any).uid,
                    customerId: (authProfile as any).profile?.customerId || (authProfile as any).uid,
                    date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
                    time: selectedTime,
                    hours: selectedHours,
                    professionals: selectedProfessionals,
                    materials: needMaterials,
                    totalAmount: finalTotal,
                    originalAmount: baseTotal,
                    discount: discountAmount,
                    couponCode: appliedCoupon?.code || null,
                    paymentStatus: 'due', // Will be updated to 'paid' after payment
                    assignedstatus: 'unassigned',
                    createdAt: serverTimestamp(),
                    instructions: instructions || '',
                    cancel: false, // Default to false for regular bookings
                    // Add timeRange in the format '10:00 am to 12:00'
                    timeRange: (() => {
                      if (!selectedTime) return '';
                      const [startHour, startMinute] = selectedTime.split(':').map(Number);
                      const startDate = new Date(selectedDate);
                      startDate.setHours(startHour, startMinute, 0, 0);
                      // End time is start + selectedHours
                      const endDate = new Date(startDate);
                      endDate.setHours(endDate.getHours() + selectedHours);
                      // Format start time as 'hh:mm am/pm'
                      const startStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
                      // Format end time as 'hh:mm' (24h or 12h as you wish, here 24h)
                      const endStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                      return `${startStr} to ${endStr}`;
                    })(),
                  };

                // Store booking data temporarily for payment modal
                setPendingBookingData(bookingData);

                // Show payment modal - booking will be created when payment is initiated
                  setIsBookingLoading(false);
                  setShowPaymentModal(true);
              } catch (outerError) {
                // This catch handles any unexpected errors in the outer try block
                console.error('Unexpected error:', outerError);
                setIsBookingLoading(false);
              }
            }}
            disabled={isBookingLoading}
          >
            {isBookingLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Confirm Booking'
            )}
          </button>

          {authProfile && (authProfile as any).uid && (
            <div className="mt-3">
              <CouponSelector
                availableCoupons={availableCoupons}
                appliedCoupon={appliedCoupon}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={removeCoupon}
                loading={couponsLoading}
              />
            </div>
          )}

          {/* Conditional routine cleaning text */}
          {showRoutineCleaning && (
            <div className="text-center mt-2">
              <button
                onClick={() => setShowRoutineRequest(true)}
                className="text-blue-600 text-xs hover:text-blue-800 underline cursor-pointer"
              >
                Would you like routine cleanings - weekly or monthly
              </button>
            </div>
          )}

        </div>
      </CardContent>
    </Card>

    {/* Routine Request Modal */}
    <RoutineRequest
      isOpen={showRoutineRequest}
      onClose={() => setShowRoutineRequest(false)}
      userId={(authProfile as any)?.uid || ''}
    />

    {/* Razorpay Payment Modal */}
    {pendingBookingData && (
      <RazorpayPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingBookingData(null);
        }}
        amount={pendingBookingData.totalAmount}
        bookingData={pendingBookingData}
        currency="AED"
        onPaymentSuccess={async (paymentStatus: 'paid' | 'due', paymentId?: string, orderId?: string, bookingId?: string) => {
          try {
            if (!bookingId) {
              throw new Error('Booking ID is missing');
            }

            // Get the current booking to check previous payment status
            const bookingRef = doc(db, 'bookings', bookingId);
            const bookingSnap = await getDoc(bookingRef);
            const previousPaymentStatus = bookingSnap.data()?.paymentStatus || 'due';
            const bookingAmount = bookingSnap.data()?.totalAmount || pendingBookingData?.totalAmount || 0;

            // Update booking paymentStatus in Firestore
            await updateDoc(bookingRef, {
              paymentStatus: paymentStatus,
            });

            // Also update in user's bookings subcollection
            const userBookingsRef = collection(db, 'users', (authProfile as any).uid, 'bookings');
            const userBookingsQuery = query(userBookingsRef, where('bookingId', '==', bookingId));
            const userBookingsSnapshot = await getDocs(userBookingsQuery);
            const updatePromises = userBookingsSnapshot.docs.map((userBookingDoc) =>
              updateDoc(doc(db, 'users', (authProfile as any).uid, 'bookings', userBookingDoc.id), {
                paymentStatus: paymentStatus,
              })
            );
            await Promise.all(updatePromises);

            // Update user's amount fields based on payment status change
            const userRef = doc(db, 'users', (authProfile as any).uid);
            
            if (paymentStatus === 'paid' && previousPaymentStatus === 'due') {
              // Payment completed: move amount from dueAmount to totalAmount
              // This ensures: dueAmount decreases, totalAmount increases
              try {
                await updateDoc(userRef, {
                  dueAmount: increment(-bookingAmount), // Decrement dueAmount
                  totalAmount: increment(bookingAmount), // Increment totalAmount
                });
                console.log('Amount fields updated:', {
                  bookingId: bookingId,
                  amount: bookingAmount,
                  action: 'moved from dueAmount to totalAmount'
                });
              } catch (amountError) {
                console.error('Error updating user amount fields:', amountError);
                // Don't fail the entire operation, but log the error
              }
            } else if (paymentStatus === 'due' && previousPaymentStatus === 'due') {
              // Pay Later selected: dueAmount was already incremented when booking was created
              // No additional action needed - amount is already in dueAmount
              console.log('Pay Later selected - dueAmount already set during booking creation');
            }
            // Note: If previousPaymentStatus was 'paid', we don't want to change anything
            // (this shouldn't happen in normal flow, but included for safety)

            // If payment is successful, create comprehensive payment record as proof
            if (paymentStatus === 'paid' && paymentId) {
              const paymentRecord = {
                // Booking reference
                bookingId: bookingId,
                userId: (authProfile as any).uid,
                
                // Payment details
                amount: bookingAmount,
                currency: 'AED',
                paymentStatus: 'paid',
                
                // Payment gateway information
                paymentGateway: 'razorpay',
                paymentMethod: 'razorpay', // Can be enhanced to include specific method (card, netbanking, etc.)
                transactionId: paymentId, // Razorpay payment ID
                orderId: orderId || '', // Razorpay order ID
                receiptNumber: orderId || paymentId, // Receipt reference
                
                // Booking information for reference
                bookingDate: pendingBookingData?.date || selectedDate?.toISOString().split('T')[0] || '',
                bookingTime: pendingBookingData?.time || selectedTime || '',
                serviceType: 'Home Cleaning',
                
                // Verification and timestamps
                verifiedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                
                // Additional metadata
                status: 'completed',
                verified: true,
              };
              
              await addDoc(collection(db, 'payments'), paymentRecord);
              
              console.log('Payment proof record created:', {
                bookingId: bookingId,
                transactionId: paymentId,
                amount: bookingAmount,
                currency: 'AED'
              });
            }

            // Create notification for booking confirmation
            try {
              const bookingDate = pendingBookingData?.date ? new Date(pendingBookingData.date) : selectedDate;
              await createBookingConfirmationNotification(
                (authProfile as any).uid,
                {
                  date: bookingDate?.toLocaleDateString() || '',
                  time: pendingBookingData?.time || selectedTime || '',
                  service: 'Home Cleaning',
                  amount: bookingAmount,
                }
              );
            } catch (notificationError) {
              console.error('Error creating notification:', notificationError);
              // Don't fail the booking if notification fails
            }

            // Send booking confirmation email to user and admin
            try {
              const userProfile = (authProfile as any).profile;
              await bookingApi.sendBookingConfirmation({
                userId: (authProfile as any).uid,
                customerId: userProfile?.customerId || (authProfile as any).uid,
                userName: userProfile?.name || 'Customer',
                userEmail: userProfile?.email || '',
                userPhone: userProfile?.phone || '',
                bookingId: bookingId,
                date: pendingBookingData?.date || selectedDate?.toISOString().split('T')[0] || '',
                time: pendingBookingData?.time || selectedTime || '',
                timeRange: pendingBookingData?.timeRange || '',
                hours: pendingBookingData?.hours || selectedHours,
                professionals: pendingBookingData?.professionals || selectedProfessionals,
                materials: pendingBookingData?.materials || needMaterials,
                totalAmount: bookingAmount,
                originalAmount: pendingBookingData?.originalAmount || baseTotal,
                discount: pendingBookingData?.discount || discountAmount,
                couponCode: pendingBookingData?.couponCode || appliedCoupon?.code,
                paymentStatus: paymentStatus,
                instructions: pendingBookingData?.instructions || instructions,
                address: userProfile?.address || '',
              });
              console.log('Booking confirmation email sent successfully');
            } catch (emailError) {
              console.error('Error sending booking confirmation email:', emailError);
              // Don't fail the booking if email fails
            }

            const bookingDate = pendingBookingData?.date ? new Date(pendingBookingData.date) : selectedDate;
            const bookingTime = pendingBookingData?.time || selectedTime;

            toast({
              title: paymentStatus === 'paid' ? "Payment Successful!" : "Booking Confirmed!",
              description: paymentStatus === 'paid' 
                ? `Payment completed. Booking confirmed for ${bookingDate?.toLocaleDateString()} at ${bookingTime}`
                : `Booking saved for ${bookingDate?.toLocaleDateString()} at ${bookingTime}. Payment due.`,
              variant: "success",
            });

            // Reset form
            setSelectedDate(null);
            setSelectedTime(null);
            setSelectedHours(2);
            setSelectedProfessionals(1);
            setNeedMaterials(false);
            setInstructions('');
            setShowPaymentModal(false);
            setPendingBookingData(null);
            removeCoupon();
          } catch (error) {
            console.error('Error updating payment status:', error);
            toast({
              title: "Error",
              description: "Booking created but failed to update payment status. Please contact support.",
              variant: "destructive",
            });
          }
        }}
        onPaymentError={(error: string) => {
          toast({
            title: "Payment Error",
            description: error,
            variant: "destructive",
          });
        }}
      />
    )}
    </>
  );
};

export default BookingSummary;