import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  isDateAvailable: (date: Date) => boolean;
  disabled?: boolean;
}

const WeekCalendar: React.FC<WeekCalendarProps> = ({
  selectedDate,
  onSelectDate,
  isDateAvailable,
  disabled = false,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate the week starting from today
  const weekDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the first day of the week (today)
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() + weekOffset * 7);
    
    // Generate 7 days starting from today (or the offset week)
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, [weekOffset]);

  // Get the month and year to display (from the middle of the week for better representation)
  const displayMonthYear = useMemo(() => {
    const midWeekDate = weekDates[3]; // Use the 4th day (middle of week)
    return midWeekDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [weekDates]);

  // Get day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigate to previous week
  const handlePrevWeek = () => {
    if (!disabled) {
      setWeekOffset(prev => prev - 1);
    }
  };

  // Navigate to next week
  const handleNextWeek = () => {
    if (!disabled) {
      setWeekOffset(prev => prev + 1);
    }
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);
    return dateCopy.getTime() === today.getTime();
  };

  // Check if a date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);
    return dateCopy.getTime() === selected.getTime();
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (!disabled && isDateAvailable(date)) {
      onSelectDate(date);
    }
  };

  return (
    <div className="w-full">
      {/* Month/Year Header with Navigation */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <button
          onClick={handlePrevWeek}
          disabled={disabled}
          className={`p-0.5 rounded transition-all ${
            disabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <h3 className="text-xs font-semibold text-gray-800 min-w-[60px] text-center">
          {displayMonthYear}
        </h3>
        <button
          onClick={handleNextWeek}
          disabled={disabled}
          className={`p-0.5 rounded transition-all ${
            disabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-[0.625rem] font-medium text-gray-500 py-0.5"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Week Dates */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, index) => {
          const dateAvailable = isDateAvailable(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          const dayNumber = date.getDate();

          return (
            <button
              key={`${date.getTime()}-${index}`}
              onClick={() => handleDateClick(date)}
              disabled={disabled || !dateAvailable}
              className={`
                w-8 h-8 rounded text-xs font-medium transition-all duration-200
                border flex items-center justify-center p-0
                ${
                  disabled || !dateAvailable
                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed shadow-sm'
                    : isSelectedDate
                    ? 'border-primary bg-primary/10 text-primary hover:border-primary/80 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
                }
              `}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekCalendar;
