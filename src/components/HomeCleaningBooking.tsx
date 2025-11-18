import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import OTPLogin from './OTPLogin';
import ProfileSetup from './ProfileSetup';
import ProfileDropdown from './ProfileDropdown';
import HomeCleanCard from './HomeCleanCard';
import { Button } from './ui/button';

import { User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BookingSummary from './BookingSummary';
import EasyMadeLogo from './EasyMadeLogo';
import Modal from './ui/Modal';
import NotificationBadge from './NotificationBadge';
import { useBookingAvailability } from '../hooks/useBookingAvailability';
import { authApi } from '../lib/api';
// AdminLink component removed as per instructions

// --- Global Auth/Profile Context ---
interface Profile {
  name: string;
  email: string;
  address: string;
  phone: string;
  customerId?: string;
  dueAmount?: number;
  totalAmount?: number;
  hours?: number;
}
interface AuthProfile {
  uid: string;
  phone: string;
  profile: null | Profile;
}
interface AuthProfileContextType {
  authProfile: AuthProfile | null;
  setAuthProfile: React.Dispatch<React.SetStateAction<AuthProfile | null>>;
}
const AuthProfileContext = createContext<AuthProfileContextType | undefined>(undefined);
export const useAuthProfile = () => useContext(AuthProfileContext);

const AuthProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  
  useEffect(() => {
    // Check if user is already authenticated on mount
    // If yes, sign them out to force OTP verification
    const checkAndSignOut = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Sign out to force OTP verification on every login
        await auth.signOut();
        setAuthProfile(null);
      }
    };
    
    checkAndSignOut();
    
    // Listen for auth state changes (but we'll handle login through OTP only)
    const unsub = onAuthStateChanged(auth, async (user) => {
      // Only set authProfile if user was authenticated through OTP flow
      // This prevents auto-login from persisting sessions
      if (user) {
        // Verify user has a phone number (required for OTP login)
        if (!user.phoneNumber) {
          // If no phone number, sign out
          await auth.signOut();
          setAuthProfile(null);
          return;
        }
        
        try {
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);
          
          if (snap.exists()) {
            // User document exists, set the profile
            setAuthProfile({
              uid: user.uid,
              phone: user.phoneNumber || '',
              profile: snap.data() as Profile,
            });
          } else {
            // User document doesn't exist - user needs to complete profile setup
            setAuthProfile({
              uid: user.uid,
              phone: user.phoneNumber || '',
              profile: null,
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // If there's an error fetching the profile, sign out the user
          await auth.signOut();
          setAuthProfile(null);
        }
      } else {
        setAuthProfile(null);
      }
    });
    
    return () => unsub();
  }, []);
  
  return (
    <AuthProfileContext.Provider value={{ authProfile, setAuthProfile }}>
      {children}
    </AuthProfileContext.Provider>
  );
};

// --- Main Booking Component ---
const HomeCleaningBooking = () => {
  const [selectedHours, setSelectedHours] = useState<number>(2);
  const [selectedProfessionals, setSelectedProfessionals] = useState<number>(1);
  const [needMaterials, setNeedMaterials] = useState<boolean>(false);
  const [instructions, setInstructions] = useState<string>('');
  const [showProfile, setShowProfile] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const { authProfile, setAuthProfile } = useAuthProfile()!;
  const { toast } = useToast();

  // Booking availability hook
  const { 
    availability, 
    loading: availabilityLoading, 
    error: availabilityError,
    isDateAvailable,
    areTimeSlotsAvailable,
    isBookingGloballyDisabled,
    isTodayBlocked
  } = useBookingAvailability();

  // Add state for selected date and time
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const timeOptions = Array.from({ length: 13 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
  
  const hourlyRate = 50; // AED per hour per professional
  const materialFee = 10; // AED flat fee for materials
  
  const calculateTotal = () => {
    const serviceTotal = hourlyRate * selectedHours * selectedProfessionals;
    const materialTotal = needMaterials ? materialFee * selectedHours : 0;
    return serviceTotal + materialTotal;
  };

  // Clear selections if booking becomes unavailable
  useEffect(() => {
    if (isBookingGloballyDisabled) {
      setSelectedDate(null);
      setSelectedTime(null);
    } else if (selectedDate && !isDateAvailable(selectedDate)) {
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [isBookingGloballyDisabled, selectedDate, isDateAvailable]);




  // --- Next Button Handler ---
  const handleNext = () => {
    if (!authProfile) {
      setShowOTP(true);
      return;
    }
    if (!authProfile.profile) {
      setShowProfileSetup(true);
      return;
    }
    // Proceed with booking flow...
  };

  // --- OTP Success Handler ---
  const handleOTPSuccess = async ({ uid, phone, isExistingUser }: { uid: string; phone: string; isExistingUser: boolean }) => {
    if (isExistingUser) {
      // Existing user - fetch their profile and log them in
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      
      if (snap.exists()) {
        // User document exists, set the profile and log them in
        const userData = snap.data() as Profile;
        setAuthProfile({
          uid,
          phone,
          profile: userData,
        });
        setShowOTP(false);
        
        // Send login notification email
        try {
          await authApi.sendLoginNotification({
            name: userData.name,
            email: userData.email,
            phone: phone,
          });
          console.log('Login notification email sent');
        } catch (emailError) {
          console.error('Failed to send login notification:', emailError);
          // Don't block login if email fails
        }
        
        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });
      } else {
        // Profile not found by UID, try to find by phone number
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', phone));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data() as Profile;
          setAuthProfile({
            uid: userDoc.id,
            phone,
            profile: userData,
          });
          setShowOTP(false);
          
          // Send login notification email
          try {
            await authApi.sendLoginNotification({
              name: userData.name,
              email: userData.email,
              phone: phone,
            });
            console.log('Login notification email sent');
          } catch (emailError) {
            console.error('Failed to send login notification:', emailError);
            // Don't block login if email fails
          }
          
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
        } else {
          // Should not happen if isExistingUser is true, but handle it
          setAuthProfile({
            uid,
            phone,
            profile: null,
          });
          setShowOTP(false);
          setShowProfileSetup(true);
        }
      }
    } else {
      // New user - show profile setup form
      setAuthProfile({
        uid,
        phone,
        profile: null,
      });
      setShowOTP(false);
      setShowProfileSetup(true);
    }
  };

  // --- Profile Setup Complete Handler ---
  const handleProfileSetupComplete = async () => {
    if (authProfile) {
      const ref = doc(db, 'users', authProfile.uid);
      const snap = await getDoc(ref);
      setAuthProfile({
        ...authProfile,
        profile: snap.exists() ? (snap.data() as Profile) : null,
      });
      setShowProfileSetup(false);
    }
  };

  // --- Logout Handler ---
  const handleLogout = async () => {
    try {
      // Sign out from Firebase Auth to clear session
      await auth.signOut();
      setAuthProfile(null);
      // Reload to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local state even if signOut fails
      setAuthProfile(null);
      window.location.reload();
    }
  };

  // --- UI ---
  return (
    <>
      <Modal open={showOTP}>
        <OTPLogin onSuccess={handleOTPSuccess} onClose={() => setShowOTP(false)} />
      </Modal>
      <Modal open={showProfileSetup && !!authProfile && !authProfile.profile}>
        {authProfile && (
          <ProfileSetup 
            uid={authProfile.uid} 
            phone={authProfile.phone} 
            onComplete={handleProfileSetupComplete} 
            onClose={() => setShowProfileSetup(false)}
            showCloseButton={false}
          />
        )}
      </Modal>
      {/* Overlay for blur when profile dropdown is open */}
      {showProfile && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm pointer-events-none select-none" />
      )}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${
        (showOTP || showProfileSetup) ? 'filter blur-sm pointer-events-none select-none' : ''
      }`}>
        <div className="w-full flex justify-between items-center px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 gap-2 sm:gap-4 relative z-50">
          <EasyMadeLogo />
          <div className="flex items-center gap-2 sm:gap-4">
            {/* AdminLink removed as per instructions */}
            <NotificationBadge className="border border-blue-600" />
            <div className="relative">
            <Button
              variant="outline"
                className="flex items-center gap-1 sm:gap-2 rounded-[50px] border border-blue-600 text-sm sm:text-base"
              onClick={() => {
                if (!authProfile) {
                  setShowOTP(true);
                  setShowProfile(false);
                } else {
                  setShowProfile((prev) => !prev);
                }
              }}
            >
                <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200">
                {authProfile && authProfile.profile && authProfile.profile.name ? (
                    <span className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 font-bold text-sm sm:text-lg flex items-center justify-center uppercase">
                    {authProfile.profile.name.charAt(0)}
                  </span>
                ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                )}
          </span>
                <span className="hidden sm:inline">Profile</span>
        </Button>
            {showProfile && authProfile && authProfile.profile && (
              <div style={{ position: "absolute", right: 0, top: "110%", zIndex: 50 }}>
                <ProfileDropdown uid={authProfile.uid} onLogout={handleLogout} />
              </div>
            )}
            </div>
          </div>
      </div>
      <div className="flex justify-center items-start flex-none min-h-screen">
        <div className="container px-4 py-4 flex justify-center w-full max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 w-full">
            {/* Main Booking Form - Full width on mobile, 2/3 on desktop */}
            <div className="col-span-1 lg:col-span-2 flex justify-center order-1 lg:order-1">
              <HomeCleanCard
                selectedHours={selectedHours}
                setSelectedHours={setSelectedHours}
                selectedProfessionals={selectedProfessionals}
                setSelectedProfessionals={setSelectedProfessionals}
                needMaterials={needMaterials}
                setNeedMaterials={setNeedMaterials}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                timeOptions={timeOptions}
                isBookingGloballyDisabled={isBookingGloballyDisabled}
                isTodayBlocked={isTodayBlocked}
                isDateAvailable={isDateAvailable}
                areTimeSlotsAvailable={areTimeSlotsAvailable}
                availabilityLoading={availabilityLoading}
                availability={availability}
                authProfile={authProfile}
              />
            </div>
            {/* Summary Panel - Full width on mobile, 1/3 on desktop */}
            <div className="col-span-1 lg:col-span-1 flex justify-center order-2 lg:order-2">
                <BookingSummary
                  selectedHours={selectedHours}
                  selectedProfessionals={selectedProfessionals}
                  needMaterials={needMaterials}
                  instructions={instructions}
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  timeOptions={timeOptions}
                  hourlyRate={hourlyRate}
                  materialFee={materialFee}
                  calculateTotal={calculateTotal}
                  setSelectedDate={setSelectedDate}
                  setSelectedTime={setSelectedTime}
                  toast={toast}
                  authProfile={authProfile}
                  setSelectedHours={setSelectedHours}
                  setSelectedProfessionals={setSelectedProfessionals}
                  setNeedMaterials={setNeedMaterials}
                  setInstructions={setInstructions}
                  setShowOTP={setShowOTP}
                  isBookingGloballyDisabled={isBookingGloballyDisabled}
                  isTodayBlocked={isTodayBlocked}
                  isDateAvailable={isDateAvailable}
                  areTimeSlotsAvailable={areTimeSlotsAvailable}
                  availabilityLoading={availabilityLoading}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

// --- Export with Provider ---
const HomeCleaningBookingWithProvider = () => (
  <AuthProfileProvider>
    <HomeCleaningBooking />
  </AuthProfileProvider>
);

export default HomeCleaningBookingWithProvider;