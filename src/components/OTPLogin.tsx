import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent } from './ui/card';

interface OTPLoginProps {
  onSuccess: (user: { uid: string; phone: string; isExistingUser: boolean }) => void;
  onClose?: () => void;
}

const OTPLogin: React.FC<OTPLoginProps> = ({ onSuccess, onClose }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const confirmationResult = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const [countryCode, setCountryCode] = useState('+971'); // Default to UAE

  const clearRecaptcha = () => {
    // Clear the verifier reference
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (err) {
        console.warn('Error clearing reCAPTCHA verifier:', err);
      }
      recaptchaVerifierRef.current = null;
    }

    // Clear window reference
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (err) {
        console.warn('Error clearing window reCAPTCHA:', err);
      }
      window.recaptchaVerifier = undefined;
    }

    // Clear the container's innerHTML to remove any rendered reCAPTCHA elements
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  // Cleanup reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupRecaptcha = () => {
    // First, clear any existing reCAPTCHA
    clearRecaptcha();

    // Ensure container exists and is empty
    const container = document.getElementById('recaptcha-container');
    if (!container) {
      throw new Error('reCAPTCHA container not found');
    }

    // Ensure container is empty
    container.innerHTML = '';

    // Wait a bit to ensure DOM is ready
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        try {
          // Create new verifier
          const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved, can proceed
              console.log('reCAPTCHA verified successfully');
            },
            'expired-callback': () => {
              setError('reCAPTCHA expired. Please try again.');
              clearRecaptcha();
            },
            'error-callback': (error: any) => {
              console.error('reCAPTCHA error:', error);
              setError('reCAPTCHA verification failed. Please refresh and try again.');
              clearRecaptcha();
            },
          });

          // Store references
          recaptchaVerifierRef.current = verifier;
          window.recaptchaVerifier = verifier;
          
          resolve();
        } catch (err: any) {
          console.error('Error creating reCAPTCHA verifier:', err);
          
          // If it's the "already rendered" error, clear and retry once
          if (err.message && err.message.includes('already been rendered')) {
            clearRecaptcha();
            setTimeout(() => {
              try {
                const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                  size: 'invisible',
                  callback: () => {
                    console.log('reCAPTCHA verified successfully');
                  },
                });
                recaptchaVerifierRef.current = verifier;
                window.recaptchaVerifier = verifier;
                resolve();
              } catch (retryErr: any) {
                reject(new Error(`Failed to initialize reCAPTCHA: ${retryErr.message || 'Unknown error'}`));
              }
            }, 500);
          } else {
            reject(new Error(`Failed to initialize reCAPTCHA: ${err.message || 'Unknown error'}`));
          }
        }
      }, 100);
    });
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Validate phone number first
      const cleanPhone = phone.replace(/\s/g, '').replace(/[^\d]/g, '');
      if (!cleanPhone || cleanPhone.length < 8 || cleanPhone.length > 15) {
        throw new Error('Please enter a valid phone number (8-15 digits)');
      }

      const fullPhone = countryCode + cleanPhone;
      console.log('Sending OTP to:', fullPhone);

      // Setup reCAPTCHA - this is now async
      await setupRecaptcha();
      
      const verifier = recaptchaVerifierRef.current || window.recaptchaVerifier;
      if (!verifier) {
        throw new Error('reCAPTCHA verifier not initialized');
      }

      // Wait a bit for reCAPTCHA to be ready
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('Calling signInWithPhoneNumber...');
      console.log('Auth config:', {
        projectId: auth.app.options.projectId,
        authDomain: auth.app.options.authDomain,
        apiKey: auth.app.options.apiKey ? '***' + auth.app.options.apiKey.slice(-4) : 'missing'
      });
      const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
      console.log('OTP sent successfully');
      
      confirmationResult.current = result;
      setStep('otp');
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-phone-number':
            errorMessage = 'Invalid phone number format. Please check and try again.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please wait a few minutes and try again.';
            break;
          case 'auth/quota-exceeded':
            errorMessage = 'SMS quota exceeded. Please contact support.';
            break;
          case 'auth/captcha-check-failed':
            errorMessage = 'reCAPTCHA verification failed. Please refresh the page and try again.';
            break;
          case 'auth/missing-phone-number':
            errorMessage = 'Phone number is required.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Phone authentication is not enabled. Please contact support.';
            break;
          case 'auth/invalid-app-credential':
            errorMessage = 'Invalid app credentials. Please verify: 1) Phone Auth is enabled in Firebase Console, 2) reCAPTCHA is configured, 3) Your domain is authorized.';
            break;
          default:
            errorMessage = err.message || `Error: ${err.code}. Please try again.`;
        }
      } else if (err.message) {
        if (err.message.includes('already been rendered')) {
          errorMessage = 'reCAPTCHA error. Please refresh the page and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Clean up reCAPTCHA on error
      clearRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!confirmationResult.current) {
        throw new Error('No confirmation result. Please request OTP again.');
      }

      if (!otp || otp.length !== 6) {
        throw new Error('Please enter the complete 6-digit OTP code.');
      }

      console.log('Verifying OTP...');
      const res = await confirmationResult.current.confirm(otp);
      console.log('OTP verified successfully');
      
      const verifiedPhone = res.user.phoneNumber || '';
      
      // Check if this phone number exists in Firestore database
      console.log('Checking if user exists in database for phone:', verifiedPhone);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', verifiedPhone));
      const querySnapshot = await getDocs(q);
      
      const isExistingUser = !querySnapshot.empty;
      
      if (isExistingUser) {
        console.log('Existing user found in database');
        // Get the existing user's document ID (which is their original Firebase UID)
        const existingUserDoc = querySnapshot.docs[0];
        const existingUid = existingUserDoc.id;
        
        // Use the existing UID from the database (the original account)
        // This ensures we log into the correct account even if Firebase Auth creates a new UID
        onSuccess({ uid: existingUid, phone: verifiedPhone, isExistingUser: true });
      } else {
        console.log('New user - phone number not found in database');
        // New user - use the Firebase Auth UID from OTP verification
        onSuccess({ uid: res.user.uid, phone: verifiedPhone, isExistingUser: false });
      }
      
      // Clean up reCAPTCHA after successful verification
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (clearErr) {
          console.warn('Error clearing reCAPTCHA after success:', clearErr);
        }
        window.recaptchaVerifier = undefined;
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-verification-code':
            errorMessage = 'Invalid OTP code. Please check and try again.';
            break;
          case 'auth/code-expired':
            errorMessage = 'OTP code has expired. Please request a new one.';
            break;
          case 'auth/session-expired':
            errorMessage = 'Session expired. Please request a new OTP.';
            break;
          default:
            errorMessage = err.message || `Error: ${err.code}. Please try again.`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setStep('phone');
    setOtp('');
    setError('');
    clearRecaptcha();
    confirmationResult.current = null;
  };

  return (
    <Card className="w-full max-w-xs sm:max-w-sm mx-auto p-2 sm:p-4" style={{ position: 'relative' }}>
      <CardContent>
        {onClose && (
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}
            aria-label="Close"
          >
            ×
          </button>
        )}
        <div id="recaptcha-container" style={{ minHeight: '1px' }} />
        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center mt-6">Verify your phone</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="border rounded px-2 py-2 bg-white text-black w-full sm:w-28 sm:w-32"
              >
                <option value="+966">🇸🇦 +966</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+968">🇴🇲 +968</option>
                <option value="+974">🇶🇦 +974</option>
                <option value="+965">🇰🇼 +965</option>
                <option value="+973">🇧🇭 +973</option>
                <option value="+91">🇮🇳 +91</option>
              </select>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                className="border rounded px-3 py-2 w-full"
                required
                minLength={8}
                maxLength={15}
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            {error && <div className="text-red-500 text-xs sm:text-sm">{error}</div>}
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <h2 className="text-base sm:text-lg font-semibold mb-2 text-center mt-6">Enter OTP</h2>
            <p className="text-sm text-gray-600 text-center mb-2">
              We sent a verification code to {countryCode} {phone}
            </p>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="border rounded px-3 py-2 w-full text-center text-lg tracking-widest"
              maxLength={6}
              required
            />
            <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              className="text-blue-600 text-sm underline"
              disabled={loading}
            >
              Resend OTP
            </button>
            {error && <div className="text-red-500 text-xs sm:text-sm">{error}</div>}
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default OTPLogin; 