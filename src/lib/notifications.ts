import { db } from '../firebase';
import { collection, doc, addDoc, query, where, getDocs, updateDoc, deleteDoc, orderBy, limit, serverTimestamp, writeBatch, onSnapshot } from 'firebase/firestore';

// Notification types
export type NotificationType = 
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'payment_due'
  | 'service_completed'
  | 'promotional'
  | 'system_alert';

// Notification priority levels
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Notification interface (new structure)
export interface Notification {
  id?: string;
  createdAt: unknown; // Firestore timestamp
  type: string; // e.g., 'booking confirmation'
  message: string;
  readStatus: boolean;
}

// Create a new notification in user's subcollection
export const createNotification = async (
  userId: string,
  notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'notifications'), {
      ...notification,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (
  userId: string,
  limitCount: number = 50,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter unread notifications on the client side to avoid index requirement
      if (!unreadOnly || data.readStatus === false) {
        notifications.push({
          id: doc.id,
          ...data,
        } as Notification);
      }
    });
    return notifications;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      readStatus: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.forEach((docSnapshot) => {
      const notificationRef = doc(db, 'notifications', docSnapshot.id);
      batch.update(notificationRef, {
        isRead: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Get unread notification count for a user
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(100) // Limit to avoid performance issues
    );
    const querySnapshot = await getDocs(q);
    let count = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.readStatus === false) {
        count++;
      }
    });
    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
};

// Create notification templates for common scenarios
export const createBookingConfirmationNotification = async (
  userId: string,
  bookingData: {
    date: string;
    time: string;
    service: string;
    amount: number;
  }
): Promise<string> => {
  return createNotification(userId, {
    type: 'booking confirmation',
    message: `Your ${bookingData.service} booking for ${bookingData.date} at ${bookingData.time} has been confirmed. Total amount: AED ${bookingData.amount}`,
    readStatus: false,
  });
};

export const createPaymentDueNotification = async (
  userId: string,
  customerId: string,
  amount: number,
  dueDate: string
): Promise<string> => {
  return createNotification(userId, {
    type: 'payment_due',
    message: `You have a payment of AED ${amount} due on ${dueDate}. Please complete your payment to avoid any service interruptions.`,
    readStatus: false,
  });
};

export const createBookingReminderNotification = async (
  userId: string,
  customerId: string,
  bookingData: {
    date: string;
    time: string;
    service: string;
  }
): Promise<string> => {
  return createNotification(userId, {
    type: 'booking_reminder',
    message: `Reminder: Your ${bookingData.service} is scheduled for tomorrow (${bookingData.date}) at ${bookingData.time}. Please ensure someone is available at the location.`,
    readStatus: false,
  });
}; 

// Test function to create a sample notification
export const createTestNotification = async (userId: string): Promise<string> => {
  return createNotification(userId, {
    type: 'test_notification',
    message: 'This is a test notification to verify the notification system is working correctly.',
    readStatus: false,
  });
};

// Test function to create a real-time test notification
export const createRealTimeTestNotification = async (userId: string): Promise<string> => {
  return createNotification(userId, {
    type: 'real_time_test',
    message: `Real-time test notification created at ${new Date().toLocaleTimeString()}. This should appear instantly!`,
    readStatus: false,
  });
};

// Real-time listener for unread notification count
export const subscribeToUnreadNotificationCount = (
  userId: string,
  callback: (count: number) => void
): (() => void) => {
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (querySnapshot) => {
    let count = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.readStatus === false) {
        count++;
      }
    });
    callback(count);
  });
};

// Real-time listener for notifications
export const subscribeToNotifications = (
  userId: string,
  unreadOnly: boolean = false,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (querySnapshot) => {
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter unread notifications on the client side to avoid index requirement
      if (!unreadOnly || data.readStatus === false) {
        notifications.push({
          id: doc.id,
          ...data,
        } as Notification);
      }
    });
    callback(notifications);
  });
}; 