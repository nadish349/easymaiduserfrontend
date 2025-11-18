import React from 'react';

interface TimeSlotProps {
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  disabled?: boolean;
  timeOptions: string[];
  areTimeSlotsAvailable?: boolean;
}

const TimeSlot: React.FC<TimeSlotProps> = ({
  selectedTime,
  onSelectTime,
  disabled = false,
  timeOptions,
  areTimeSlotsAvailable = true,
}) => {
  // Format time from 24-hour to 12-hour format (e.g., "08:00" -> "8 AM")
  const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12} ${ampm}`;
  };

  // Filter times from 8 AM to 6 PM (08:00 to 18:00)
  const filteredTimes = timeOptions.filter(time => {
    const [hours] = time.split(':').map(Number);
    return hours >= 8 && hours <= 18;
  });

  // Handle time click
  const handleTimeClick = (time: string) => {
    if (!disabled && areTimeSlotsAvailable) {
      onSelectTime(time);
    }
  };

  // Check if a time is selected
  const isSelected = (time: string) => {
    return selectedTime === time;
  };

  const isDisabled = disabled || !areTimeSlotsAvailable;

  return (
    <div className="w-full">
      {/* Time Slots Grid */}
      <div className="grid grid-cols-5 gap-1">
        {filteredTimes.map((time) => {
          const isSelectedTime = isSelected(time);

          return (
            <button
              key={time}
              onClick={() => handleTimeClick(time)}
              disabled={isDisabled}
              className={`
                h-8 rounded-[20px] text-[0.625rem] font-medium transition-all duration-200
                border flex items-center justify-center px-1
                ${
                  isDisabled
                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed shadow-sm'
                    : isSelectedTime
                    ? 'border-primary bg-primary/10 text-primary hover:border-primary/80 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
                }
              `}
            >
              {formatTime(time)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlot;

