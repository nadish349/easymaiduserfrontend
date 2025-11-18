import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import InlineBusyPopup from './InlineBusyPopup';
import WeekCalendar from './WeekCalendar';
import TimeSlot from './TimeSlot';

interface HomeCleanCardProps {
  selectedHours: number;
  setSelectedHours: (hours: number) => void;
  selectedProfessionals: number;
  setSelectedProfessionals: (professionals: number) => void;
  needMaterials: boolean;
  setNeedMaterials: (materials: boolean) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string | null) => void;
  timeOptions: string[];
  isBookingGloballyDisabled: boolean;
  isTodayBlocked: boolean;
  isDateAvailable: (date: Date) => boolean;
  areTimeSlotsAvailable: (date: Date | null) => boolean;
  availabilityLoading: boolean;
  availability: {
    bookingavailability: boolean;
    bookingForToday: boolean;
  };
  authProfile: unknown; // Add authProfile to check if user is logged in
}

const HomeCleanCard: React.FC<HomeCleanCardProps> = ({
  selectedHours,
  setSelectedHours,
  selectedProfessionals,
  setSelectedProfessionals,
  needMaterials,
  setNeedMaterials,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  timeOptions,
  isBookingGloballyDisabled,
  isTodayBlocked,
  isDateAvailable,
  areTimeSlotsAvailable,
  availabilityLoading,
  availability,
  authProfile,
}) => {
  const [showInlineBusyPopup, setShowInlineBusyPopup] = useState(false);

  const CircularButton = ({ 
     value, 
     isSelected, 
     onClick, 
     children 
   }: { 
     value: number; 
     isSelected: boolean; 
     onClick: () => void;
     children: React.ReactNode;
   }) => (
     <button
       onClick={onClick}
       className={`
         w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 font-medium text-xs sm:text-sm transition-all duration-200
         ${isSelected 
           ? 'border-primary bg-primary-light text-primary' 
           : 'border-border bg-background text-foreground hover:border-primary/50'
         }
       `}
     >
       {children}
     </button>
   );

   const PillButton = ({ 
     isSelected, 
     onClick, 
     children 
   }: { 
     isSelected: boolean; 
     onClick: () => void;
     children: React.ReactNode;
   }) => (
     <button
       onClick={onClick}
       className={`
         px-3 sm:px-4 py-2 rounded-full border-2 font-medium text-xs sm:text-sm transition-all duration-200
         ${isSelected 
           ? 'border-primary bg-primary-light text-primary' 
           : 'border-border bg-background text-foreground hover:border-primary/50'
         }
       `}
     >
       {children}
     </button>
   );

  // Helper function to get availability message
  const getAvailabilityMessage = () => {
    if (availabilityLoading) {
      return "Loading availability...";
    }
    
    if (isBookingGloballyDisabled) {
      return "Booking disabled - contact service for availability";
    }
    
    // Don't show any message when booking is available or today is blocked
    return null;
  };

  // Show inline popup when today is blocked - ONLY if user is logged in
  React.useEffect(() => {
    // Only show busy message if user is logged in and database check is complete
    if (isTodayBlocked && !availabilityLoading && authProfile) {
      setShowInlineBusyPopup(true);
    } else {
      setShowInlineBusyPopup(false);
    }
  }, [isTodayBlocked, availabilityLoading, authProfile]);

  return (
    <Card
      className="w-full max-w-xl mx-auto flex flex-col bg-white/90 backdrop-blur-sm"
      style={{
        padding: '12px',
        border: '3px solid transparent',
        borderRadius: '12px',
        background: 'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)) padding-box, linear-gradient(90deg, #ff3c3c, #ff9900) border-box',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <CardContent className="flex flex-col flex-none p-0">
                 <div className="mb-2 sm:mb-3">
           <div className="flex justify-center items-center">
             <span className="font-semibold text-xl sm:text-2xl">Home Cleaning</span>
           </div>
         </div>
                 <div className="space-y-3 sm:space-y-4 flex-none overflow-y-visible pr-1">
           {/* Hours Selection */}
           <div>
             <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
               How many hours do you need your professional to stay?
             </h3>
             <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
               {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                 <CircularButton
                   key={hour}
                   value={hour}
                   isSelected={selectedHours === hour}
                   onClick={() => setSelectedHours(hour)}
                 >
                   {hour}
                 </CircularButton>
               ))}
             </div>
           </div>
           {/* Professionals Selection */}
           <div>
             <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
               How many professionals do you need?
             </h3>
             <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
               {[1, 2, 3, 4].map((count) => (
                 <CircularButton
                   key={count}
                   value={count}
                   isSelected={selectedProfessionals === count}
                   onClick={() => setSelectedProfessionals(count)}
                 >
                   {count}
                 </CircularButton>
               ))}
             </div>
           </div>
           {/* Materials Selection */}
           <div>
             <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
               Need cleaning materials?
             </h3>
             <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center sm:justify-start">
               <PillButton
                 isSelected={!needMaterials}
                 onClick={() => setNeedMaterials(false)}
               >
                 No, I have them
               </PillButton>
               <PillButton
                 isSelected={needMaterials}
                 onClick={() => setNeedMaterials(true)}
               >
                 Yes, please
               </PillButton>
             </div>
           </div>
                     {/* Slot Section */}
           <div className="text-sm">
             <h4 className="text-lg font-medium mb-2">Slot</h4>
             
             {/* Availability Message */}
             {getAvailabilityMessage() && (
               <div className="mb-3 p-2 rounded-lg text-sm bg-red-100 text-red-700 border border-red-200">
                 {getAvailabilityMessage()}
               </div>
             )}
             
             <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
               <div className="flex flex-col items-center w-full">
                 <span className="font-medium mb-1 text-sm sm:text-base">Day:</span>
                 <div className="w-full max-w-md">
                   <WeekCalendar
                     selectedDate={selectedDate}
                     onSelectDate={(date) => {
                       if (isDateAvailable(date)) {
                         setSelectedDate(date);
                       }
                     }}
                     isDateAvailable={isDateAvailable}
                     disabled={isBookingGloballyDisabled}
                   />
                 </div>
               </div>
               <div className="flex flex-col items-center w-full">
                 <span className="font-medium mb-1 text-sm sm:text-base">Time:</span>
                 <div className="w-full max-w-md">
                   <TimeSlot
                     selectedTime={selectedTime}
                     onSelectTime={(time) => {
                       if (!isBookingGloballyDisabled && areTimeSlotsAvailable(selectedDate)) {
                         setSelectedTime(time);
                       }
                     }}
                     timeOptions={timeOptions}
                     disabled={isBookingGloballyDisabled}
                     areTimeSlotsAvailable={areTimeSlotsAvailable(selectedDate)}
                   />
                 </div>
               </div>
             </div>
             
             {/* Inline Busy Popup for Today Blocked - Below Slot Selectors */}
             <InlineBusyPopup
               isOpen={showInlineBusyPopup}
               onClose={() => setShowInlineBusyPopup(false)}
               message="Today's schedule is busy - contact service for availability"
             />
           </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HomeCleanCard; 