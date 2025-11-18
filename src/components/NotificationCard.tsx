import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { subscribeToNotifications, markNotificationAsRead, Notification } from '../lib/notifications';

interface NotificationCardProps {
  userId: string;
  onClose: () => void;
  className?: string;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ userId, onClose, className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    
    // Subscribe to real-time notifications (unread only)
    const unsubscribe = subscribeToNotifications(
      userId,
      true, // unreadOnly = true
      (notifs) => {
        setNotifications(notifs);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleDiscard = async (notificationId: string) => {
    try {
      await markNotificationAsRead(userId, notificationId);
      // The real-time listener will automatically update the list
    } catch (error) {
      console.error('Error discarding notification:', error);
    }
  };

  return (
    <div ref={cardRef} className={`absolute right-0 mt-2 z-50 w-80 max-w-xs ${className}`}>
      <Card>
        <CardContent className="p-4">
          <h4 className="font-bold mb-2">Notifications</h4>
          {isLoading && <div className="text-gray-400 text-sm">Loading...</div>}
          {!isLoading && notifications.length === 0 && (
            <div className="text-gray-500 text-sm">No new notifications.</div>
          )}
          {notifications.map((notif) => (
            <div key={notif.id} className="mb-4 border-b pb-2 last:border-b-0 last:pb-0">
              <div className="text-sm font-medium mb-1">{notif.type}</div>
              <div className="text-xs mb-2">{notif.message}</div>
              <button
                className="text-xs text-red-600 hover:underline"
                onClick={() => handleDiscard(notif.id!)}
              >
                Discard Message
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCard;