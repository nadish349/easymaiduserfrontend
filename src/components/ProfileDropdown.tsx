import React, { useEffect, useState } from "react";
import { FaUser, FaEdit, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { Card, CardContent } from "./ui/card";
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import OTPLogin from './OTPLogin';

interface Profile {
  name: string;
  email: string;
  phone: string;
  address: string;
  customerId?: string; // Added customerId to the interface
  dueAmount?: number;
  totalAmount?: number;
  hours?: number;
}

interface Booking {
  id: string;
  date: string;
  time: string;
  hours: number;
  professionals: number;
  materials: boolean;
  totalAmount: number;
  paymentStatus: string;
  createdAt: any;
  instructions: string;
  timeRange: string;
}

interface ProfileDropdownProps {
  uid: string;
  onLogout: () => void;
}

function getCountryFromPhone(phone: string): string {
  if (phone.startsWith('+966')) return 'Saudi Arabia';
  if (phone.startsWith('+971')) return 'United Arab Emirates';
  if (phone.startsWith('+968')) return 'Oman';
  if (phone.startsWith('+974')) return 'Qatar';
  if (phone.startsWith('+965')) return 'Kuwait';
  if (phone.startsWith('+973')) return 'Bahrain';
  if (phone.startsWith('+91')) return 'India';
  return '';
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ uid, onLogout }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', email: '' });
  const [showOTP, setShowOTP] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showBookingsCard, setShowBookingsCard] = useState(false);
  const [showBookingsInDropdown, setShowBookingsInDropdown] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      console.log('Fetching bookings from user subcollection for user:', uid);
      
      // Fetch from user's bookings subcollection
      const userBookingsRef = collection(db, 'users', uid, 'bookings');
      const q = query(
        userBookingsRef,
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('User bookings query size:', querySnapshot.size);
      
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('User booking data:', data);
        bookingsData.push({
          id: doc.id,
          ...data
        } as Booking);
      });
      console.log('Processed user bookings:', bookingsData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [uid]);

  const formatBookingDate = (dateString: string, timeString: string) => {
    try {
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      return `${formattedDate} at ${timeString}`;
    } catch (error) {
      return `${dateString} at ${timeString}`;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'users', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Profile;
          setProfile(data);
          setForm({ name: data.name, address: data.address, email: data.email });
        } else {
          // User document doesn't exist, trigger logout
          console.log('User document not found in ProfileDropdown, signing out');
          await auth.signOut();
          onLogout();
        }
      } catch (error) {
        console.error('Error fetching profile in ProfileDropdown:', error);
        // If there's an error, trigger logout
        await auth.signOut();
        onLogout();
      }
      setLoading(false);
    };
    fetchProfile();
  }, [uid, onLogout]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    if (profile) setForm({ name: profile.name, address: profile.address, email: profile.email });
    setEditMode(false);
    setError('');
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError('');
    try {
      await setDoc(doc(db, 'users', uid), {
        ...profile,
        ...form,
      });
      setProfile({ ...profile, ...form });
      setEditMode(false);
    } catch (err) {
      setError('Failed to update profile.');
    }
    setSaving(false);
  };
  const handlePhoneChange = () => setShowOTP(true);
  const handleOTPSuccess = async ({ uid, phone, isExistingUser }: { uid: string; phone: string; isExistingUser: boolean }) => {
    if (!profile) return;
    setSaving(true);
    setError('');
    try {
      await setDoc(doc(db, 'users', uid), {
        ...profile,
        ...form,
        phone,
      });
      setProfile({ ...profile, ...form, phone });
      setShowOTP(false);
    } catch (err) {
      setError('Failed to update phone number.');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
    onLogout();
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>No profile found.</div>;

  return (
    <Card style={{ minWidth: 260, maxWidth: 320, height: 'auto', padding: 0, border: '2px solid #3B82F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <CardContent style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showOTP && (
          <OTPLogin
            onSuccess={handleOTPSuccess}
            onClose={() => setShowOTP(false)}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#e5e7eb',
            marginBottom: 4,
          }}>
            <span style={{
              color: '#3B82F6',
              fontWeight: 'bold',
              fontSize: 28,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
            }}>
              {profile.name ? profile.name.charAt(0) : '?'}
            </span>
          </span>
          <span style={{ fontSize: 13, color: '#3B82F6' }}>Customer ID</span>
          <span style={{ fontSize: 13 }}>{profile.customerId || uid}</span>
        </div>
        <div style={{ marginBottom: 12, fontSize: 13, color: '#222', border: '2px solid #3B82F6', borderRadius: 10, padding: 12, background: '#f9f9ff', position: 'relative' }}>
          <div style={{ marginBottom: 4, color: '#3B82F6', fontWeight: 500 }}>Customer Details</div>
          {editMode ? (
            <>
              <div style={{ marginBottom: 4 }}>
                Name: <input name="name" value={form.name} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
              </div>
              <div style={{ marginBottom: 4 }}>
                Email: <input name="email" value={form.email} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
              </div>
              <div style={{ marginBottom: 4 }}>
                Phone: <input value={profile?.phone} disabled className="border rounded px-2 py-1 w-2/3 bg-gray-100 text-gray-500" style={{ marginRight: 8 }} />
                <button type="button" onClick={handlePhoneChange} className="text-blue-600 underline text-xs">Change</button>
              </div>
              <div style={{ marginBottom: 0 }}>
                Address: <input name="address" value={form.address} onChange={handleChange} className="border rounded px-2 py-1 w-full" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button onClick={handleCancel} className="text-gray-500 text-xs px-2 py-1 border rounded">Cancel</button>
                <button onClick={handleSave} className="bg-blue-600 text-white text-xs px-3 py-1 rounded" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
              {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
            </>
          ) : (
            <>
              <div style={{ marginBottom: 4 }}>Name: {profile.name}</div>
              <div style={{ marginBottom: 4 }}>Email: {profile.email}</div>
              <div style={{ marginBottom: 4 }}>Phone: {profile.phone}</div>
              <div style={{ marginBottom: 0 }}>
                Address: {getCountryFromPhone(profile.phone) ? getCountryFromPhone(profile.phone) + ', ' : ''}{profile.address}
              </div>
              {/* Edit button */}
              <button
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#3B82F6',
                  fontSize: 18,
                }}
                aria-label="Edit Customer Details"
                onClick={handleEdit}
              >
                <FaEdit />
              </button>
            </>
          )}
        </div>
        {/* Due Amount Box */}
        <div style={{ marginBottom: 12, fontSize: 13, color: '#222', border: '2px solid #3B82F6', borderRadius: 10, padding: 12, background: '#f9f9ff' }}>
          <div style={{ marginBottom: 4, color: '#3B82F6', fontWeight: 500 }}>Due Amount</div>
          <div style={{ marginBottom: 0, fontSize: 16, fontWeight: 600, color: profile.dueAmount && profile.dueAmount > 0 ? '#dc2626' : '#222' }}>
            AED {(profile.dueAmount || 0).toFixed(2)}
          </div>
        </div>
        {/* Bookings Box */}
        <button 
          type="button"
          onClick={() => setShowBookingsInDropdown(!showBookingsInDropdown)}
          style={{ 
            fontSize: 13, 
            color: '#222', 
            border: '2px solid #3B82F6', 
            borderRadius: 10, 
            padding: 12, 
            background: '#f9fafb',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ color: '#3B82F6', fontWeight: 500 }}>Bookings</div>
          <FaChevronDown style={{ 
            color: '#3B82F6', 
            fontSize: '12px',
            transform: showBookingsInDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }} />
        </button>
        
        {/* Bookings Content */}
        {showBookingsInDropdown && (
          <div style={{
            marginTop: '8px',
            padding: '12px',
            background: 'white',
            border: '2px solid #3B82F6',
            borderRadius: '10px',
            fontSize: '12px',
            position: 'relative'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{ color: '#3B82F6', fontWeight: 500, fontSize: '13px' }}>
                Recent Bookings
              </div>
              <button
                type="button"
                onClick={() => setShowBookingsInDropdown(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  padding: '0',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            {bookingsLoading ? (
              <div style={{ color: '#666', fontSize: '11px', lineHeight: '1.4' }}>
                Loading bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div style={{ color: '#666', fontSize: '11px', lineHeight: '1.4' }}>
                You haven't made any bookings yet. Start by booking a cleaning service!
              </div>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {bookings.map((booking) => (
                  <div key={booking.id} style={{ 
                    marginBottom: '8px', 
                    padding: '6px', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '4px',
                    background: '#f9fafb'
                  }}>
                    <div style={{ fontWeight: 500, fontSize: '11px', color: '#374151' }}>
                      {formatBookingDate(booking.date, booking.time)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                      {booking.hours}h • {booking.professionals} professional{booking.professionals > 1 ? 's' : ''} • AED {booking.totalAmount}
                    </div>
                    {booking.instructions && (
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', fontStyle: 'italic' }}>
                        "{booking.instructions}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <div style={{ padding: 16, paddingTop: 0, marginTop: 'auto' }}>
        <button
          onClick={handleLogout}
          style={{
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 3,
            padding: '12px 0',
            fontSize: 15,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          <FaSignOutAlt style={{ fontSize: 15 }} /> Logout
        </button>
      </div>
    </Card>
  );
};

export default ProfileDropdown; 