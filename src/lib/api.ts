/**
 * API Service for backend communication
 */

// TEMPORARY: Hardcoded fallback to bypass Vite env loading issue
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://easymaiduserbackend.vercel.app/api';

// Log the API base URL for debugging
console.log('API Base URL:', API_BASE_URL);

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Payment API functions
 */
export const paymentApi = {
  /**
   * Create Razorpay payment order
   */
  createPaymentOrder: async (bookingId: string, amount: number, currency: string = 'INR') => {
    return apiRequest<{
      orderId: string;
      amount: number;
      currency: string;
      key: string;
      bookingId: string;
    }>('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ bookingId, amount, currency }),
    });
  },

  /**
   * Verify Razorpay payment
   */
  verifyPayment: async (
    orderId: string,
    paymentId: string,
    signature: string,
    bookingId: string
  ) => {
    return apiRequest<{
      bookingId: string;
      paymentId: string;
      orderId: string;
      paymentStatus: string;
    }>('/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentId, signature, bookingId }),
    });
  },

  /**
   * Mark booking as Pay Later
   */
  markPayLater: async (bookingId: string) => {
    return apiRequest<{
      bookingId: string;
      paymentStatus: string;
    }>('/payment/pay-later', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    });
  },
};

/**
 * Auth API functions
 */
export const authApi = {
  /**
   * Send welcome email on first account creation
   */
  sendWelcomeEmail: async (userData: {
    name: string;
    email: string;
    phone: string;
    customerId: string;
  }) => {
    return apiRequest<{ message: string }>('/auth/welcome', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Send login notification email
   */
  sendLoginNotification: async (userData: {
    name: string;
    email: string;
    phone: string;
  }) => {
    return apiRequest<{ message: string }>('/auth/login-notification', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

/**
 * Booking API functions
 */
export const bookingApi = {
  /**
   * Send booking confirmation email to user and admin
   */
  sendBookingConfirmation: async (bookingData: {
    userId: string;
    customerId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    bookingId: string;
    date: string;
    time: string;
    timeRange?: string;
    hours: number;
    professionals: number;
    materials: boolean;
    totalAmount: number;
    originalAmount: number;
    discount: number;
    couponCode?: string;
    paymentStatus: 'paid' | 'due';
    instructions?: string;
    address?: string;
  }) => {
    return apiRequest<{
      customerEmailSent: boolean;
      adminEmailSent: boolean;
    }>('/booking/confirmation', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },
};

/**
 * Health Check API
 */
export const healthApi = {
  /**
   * Check backend health status
   */
  checkHealth: async () => {
    try {
      const response = await fetch(API_BASE_URL.replace('/api', '/health'));
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
};




