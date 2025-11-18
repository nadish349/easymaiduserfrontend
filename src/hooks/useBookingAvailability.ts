import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface BookingAvailability {
  bookingavailability: boolean;
  bookingForToday: boolean;
}

export const useBookingAvailability = () => {
  const [availability, setAvailability] = useState<BookingAvailability>({
    bookingavailability: true,
    bookingForToday: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const availabilityRef = doc(db, 'settings', 'booking-availability');
    
    const unsubscribe = onSnapshot(
      availabilityRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as BookingAvailability;
          setAvailability(data);
          setError(null);
        } else {
          // Default values if document doesn't exist
          setAvailability({
            bookingavailability: true,
            bookingForToday: false
          });
          setError(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching booking availability:', err);
        setError('Failed to load booking availability');
        setLoading(false);
        // Set default values on error
        setAvailability({
          bookingavailability: true,
          bookingForToday: false
        });
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper function to check if a specific date is available
  const isDateAvailable = (date: Date): boolean => {
    if (!availability.bookingavailability) {
      return false; // Global booking disabled
    }

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday && !availability.bookingForToday) {
      return false; // Today is blocked when bookingForToday is false
    }

    return true;
  };

  // Helper function to check if time slots are available
  const areTimeSlotsAvailable = (date: Date | null): boolean => {
    if (!date) return false;
    return isDateAvailable(date);
  };

  return {
    availability,
    loading,
    error,
    isDateAvailable,
    areTimeSlotsAvailable,
    isBookingGloballyDisabled: !availability.bookingavailability,
    isTodayBlocked: !availability.bookingForToday
  };
};
