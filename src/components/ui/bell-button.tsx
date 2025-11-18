import { BadgeBell } from "@/components/ui/badge-bell";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { subscribeToUnreadNotificationCount } from "../../lib/notifications";
import NotificationCard from "../NotificationCard";

interface BellButtonProps {
  className?: string;
  userId?: string;
}

function BellButton({ className, userId }: BellButtonProps) {
  const [count, setCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    setIsLoading(true);
    
    // Subscribe to real-time unread notification count
    const unsubscribe = subscribeToUnreadNotificationCount(
      userId,
      (count) => {
        setCount(count);
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount or when userId changes
    return () => {
      unsubscribe();
    };
  }, [userId]);

  const handleClick = () => {
    if (!userId) return;
    setShowNotifications(prev => !prev);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className={`relative ${className ?? ''}`}
        onClick={handleClick}
        aria-label="Notifications"
      >
        <Bell size={16} strokeWidth={2} aria-hidden="true" />
        {count > 0 && (
          <BadgeBell className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1">
            {count > 99 ? "99+" : count}
          </BadgeBell>
        )}
        {isLoading && (
          <BadgeBell className="absolute -top-2 left-full min-w-5 -translate-x-1/2 px-1">
            ...
          </BadgeBell>
        )}
      </Button>
      {showNotifications && userId && (
        <NotificationCard
          userId={userId}
          onClose={handleCloseNotifications}
        />
      )}
    </div>
  );
}

export { BellButton }; 