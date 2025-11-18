import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent } from './ui/card';
import { authApi } from '../lib/api';

function generateCustomerId() {
  // Generates a 6-character ID: 3 digits + 3 uppercase letters
  const digits = Math.floor(100 + Math.random() * 900).toString();
  const letters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  return digits + letters;
}

async function getUniqueCustomerId() {
  let attempts = 0;
  while (attempts < 5) {
    const customerId = generateCustomerId();
    const q = query(collection(db, 'users'), where('customerId', '==', customerId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return customerId;
    }
    attempts++;
  }
  throw new Error('Could not generate a unique customer ID. Please try again.');
}

interface ProfileSetupProps {
  uid: string;
  phone: string;
  onComplete: () => void;
  onClose?: () => void;
  showCloseButton?: boolean; // New prop to control close button visibility
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ 
  uid, 
  phone, 
  onComplete, 
  onClose, 
  showCloseButton = false // Default to false for new user registration
}) => {
  const [form, setForm] = useState({ name: '', address: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const customerId = await getUniqueCustomerId();
      await setDoc(doc(db, 'users', uid), {
        ...form,
        phone,
        customerId,
        dueAmount: 0,
        totalAmount: 0,
        hours: 0,
        createdAt: new Date().toISOString(),
      });
      
      // Send welcome email
      try {
        await authApi.sendWelcomeEmail({
          name: form.name,
          email: form.email,
          phone: phone,
          customerId: customerId,
        });
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't block registration if email fails
      }
      
      onComplete();
    } catch (err: unknown) {
      if (typeof err === 'object' && err && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Failed to save profile.');
      }
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-xs sm:max-w-sm mx-auto p-2 sm:p-4" style={{ position: 'relative' }}>
      <CardContent>
        {onClose && showCloseButton && (
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}
            aria-label="Close"
          >
            ×
          </button>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="text-base sm:text-lg font-semibold mb-2 text-center">Profile Setup</h2>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="border rounded px-3 py-2 w-full"
            required
          />
          <input
            type="text"
            value={phone}
            disabled
            className="border rounded px-3 py-2 bg-gray-100 text-gray-500"
            style={{ cursor: 'not-allowed' }}
          />
          {error && <div className="text-red-500 text-xs sm:text-sm">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 w-full font-semibold"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSetup; 