import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/firebase';
import {
  fetchAvailableCouponsForUser,
  applyCouponForUser,
  calculateDiscount,
  Coupon,
  AvailabilityOptions,
} from '@/lib/coupons';

export function useCoupons(bookingHours?: number, orderAmount?: number) {
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const userId = auth.currentUser?.uid;

  const loadCoupons = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const opts: AvailabilityOptions = {
        bookingHours,
        orderAmount,
      };
      const coupons = await fetchAvailableCouponsForUser(userId, opts);
      setAvailableCoupons(coupons);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [userId, bookingHours, orderAmount]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) {
      return { success: false, message: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);
    try {
      const opts: AvailabilityOptions = {
        bookingHours,
        orderAmount,
      };
      const result = await applyCouponForUser(code, userId, opts);
      
      if (result.success) {
        const coupon = availableCoupons.find(c => c.code === code);
        if (coupon) {
          setAppliedCoupon(coupon);
        }
        await loadCoupons();
      }
      
      return result;
    } catch (e: any) {
      const message = e?.message ?? 'Failed to apply coupon';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getDiscountAmount = useCallback(() => {
    if (!appliedCoupon || !orderAmount) return 0;
    return calculateDiscount(appliedCoupon, orderAmount);
  }, [appliedCoupon, orderAmount]);

  const getFinalAmount = useCallback(() => {
    if (!orderAmount) return 0;
    const discount = getDiscountAmount();
    return Math.max(0, orderAmount - discount);
  }, [orderAmount, getDiscountAmount]);

  return {
    availableCoupons,
    loading,
    error,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getDiscountAmount,
    getFinalAmount,
    refreshCoupons: loadCoupons,
  };
}
