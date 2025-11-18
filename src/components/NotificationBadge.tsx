import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { subscribeToUnreadNotificationCount } from '../lib/notifications';
import { useAuthProfile } from './HomeCleaningBooking';
import NotificationCard from './NotificationCard';

interface NotificationBadgeProps {
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ className = '' }) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCard, setShowCard] = useState<boolean>(false);
  const { authProfile } = useAuthProfile()!;

  useEffect(() => {
    if (!authProfile?.uid) {
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    
    // Subscribe to real-time unread notification count
    const unsubscribe = subscribeToUnreadNotificationCount(
      authProfile.uid,
      (count) => {
        setUnreadCount(count);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount or when userId changes
    return () => {
      unsubscribe();
    };
  }, [authProfile?.uid]);

  const handleBellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authProfile?.uid) return;
    setShowCard((prev) => !prev);
  };

  if (!authProfile) return null;

  return (
    <div className={`relative ${className}`} style={{ display: 'inline-block' }}>
      <div
        className="relative cursor-pointer"
        onClick={handleBellClick}
      >
        <Bell className="w-6 h-6 text-blue-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isLoading && (
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            ...
          </span>
        )}
      </div>
      {showCard && (
        <NotificationCard
          userId={authProfile.uid}
          onClose={() => setShowCard(false)}
        />
      )}
    </div>
  );
};

export default NotificationBadge; 