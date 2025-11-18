import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TEMPORARY: Hardcoded values to bypass Vite env loading issue
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBDBhgIAgzGFmyb5Fl0jaaHyXp6F45TcVE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "easymaid-booking.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "easymaid-booking",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "easymaid-booking.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "274564455005",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:274564455005:web:a40210f3b8b05ad8cfcbb4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MVXDCPYYZN"
};

// Debug: Log actual values (REMOVE IN PRODUCTION)
console.log('🔍 Environment Variables Debug:');
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '✓ Set' : '✗ Not Set');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

// Log Firebase config for debugging (remove in production)
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '✓ Loaded' : '✗ Missing',
  authDomain: firebaseConfig.authDomain ? '✓ Loaded' : '✗ Missing',
  projectId: firebaseConfig.projectId ? '✓ Loaded' : '✗ Missing',
  storageBucket: firebaseConfig.storageBucket ? '✓ Loaded' : '✗ Missing',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Loaded' : '✗ Missing',
  appId: firebaseConfig.appId ? '✓ Loaded' : '✗ Missing',
  measurementId: firebaseConfig.measurementId ? '✓ Loaded' : '✗ Missing',
});

// Validate required fields
if (!firebaseConfig.projectId || !firebaseConfig.apiKey || !firebaseConfig.appId) {
  console.error('❌ Firebase configuration is incomplete! Please restart your dev server.');
  console.error('Missing values:', {
    projectId: !firebaseConfig.projectId,
    apiKey: !firebaseConfig.apiKey,
    appId: !firebaseConfig.appId,
  });
  console.error('💡 TIP: Make sure you have restarted your dev server after updating .env file!');
}

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize auth for production - will send real OTPs to real phone numbers
// Note: Make sure test phone numbers are removed from Firebase Console
export const auth = getAuth(app);
export const db = getFirestore(app); 