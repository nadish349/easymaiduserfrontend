import { db } from '@/firebase';
import {
  collectionGroup,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  doc,
  getDoc,
  increment,
  setDoc,
} from 'firebase/firestore';

export type CouponType =
  | 'totalHoursThreshold'
  | 'totalAmountThreshold'
  | 'festivalAll'
  | 'singleBookingHoursThreshold';

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  type: CouponType;
  title: string;
  code: string;
  description?: string;
  isActive: boolean;

  discountType: DiscountType;
  discountValue: number;

  threshold?: number;

  validFrom: string;
  validUntil: string;

  usageLimit: number;
  usedCount: number;

  minOrderAmount?: number;
  maxDiscount?: number;
  
  _docPath?: string;
}

export interface UserMetrics {
  hours: number;
  totalamount: number;
}

export interface AvailabilityOptions {
  bookingHours?: number;
  orderAmount?: number;
  now?: Date;
}

function parseDateSafe(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function isCouponAvailable(coupon: Coupon, now: Date): boolean {
  if (!coupon.isActive) return false;

  const start = parseDateSafe(coupon.validFrom);
  const end = parseDateSafe(coupon.validUntil);
  if (!start || !end) return false;

  const time = now.getTime();
  if (time < start.getTime() || time > end.getTime()) return false;

  const used = typeof coupon.usedCount === 'number' ? coupon.usedCount : 0;
  const limitVal = typeof coupon.usageLimit === 'number' ? coupon.usageLimit : 0;
  if (limitVal <= 0) return false;

  return used < limitVal;
}

function isCouponEligibleForUser(
  coupon: Coupon,
  user: UserMetrics,
  opts: AvailabilityOptions
): boolean {
  const threshold = typeof coupon.threshold === 'number' ? coupon.threshold : undefined;
  const bookingHours = opts.bookingHours ?? 0;
  const userHours = user.hours ?? 0;
  const userTotalAmount = user.totalamount ?? 0;

  if (typeof coupon.minOrderAmount === 'number') {
    const orderAmount = opts.orderAmount ?? 0;
    if (orderAmount < coupon.minOrderAmount) return false;
  }

  switch (coupon.type) {
    case 'totalHoursThreshold':
      if (threshold === undefined) return false;
      return userHours >= threshold;

    case 'totalAmountThreshold':
      if (threshold === undefined) return false;
      return userTotalAmount >= threshold;

    case 'singleBookingHoursThreshold':
      if (threshold === undefined) return false;
      return bookingHours >= threshold;

    case 'festivalAll':
      return true;

    default:
      return false;
  }
}

async function getUserMetrics(userId: string): Promise<UserMetrics> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? (snap.data() as Partial<UserMetrics>) : {};
  return {
    hours: Number(data.hours ?? 0),
    totalamount: Number(data.totalamount ?? 0),
  };
}

async function hasUserAppliedCouponInDoc(couponDocRef: any, userId: string): Promise<boolean> {
  const userAppliedRef = doc(couponDocRef, 'users', userId);
  const snap = await getDoc(userAppliedRef);
  if (!snap.exists()) return false;
  const data = snap.data();
  return data?.applied === true;
}

export async function fetchAllCoupons(): Promise<Coupon[]> {
  const cg = collectionGroup(db, 'coupons');
  const qsnap = await getDocs(cg);
  const out: Coupon[] = [];
  qsnap.forEach((docSnap) => {
    const data = docSnap.data() as Partial<Coupon>;
    const required = [
      'type',
      'title',
      'code',
      'isActive',
      'discountType',
      'discountValue',
      'validFrom',
      'validUntil',
      'usageLimit',
    ];
    const missing = required.filter((k) => data[k as keyof Coupon] === undefined);
    if (missing.length > 0) return;

    out.push({
      id: docSnap.id,
      type: data.type as CouponType,
      title: String(data.title),
      code: String(data.code),
      description: data.description ? String(data.description) : undefined,
      isActive: Boolean(data.isActive),
      discountType: data.discountType as DiscountType,
      discountValue: Number(data.discountValue),
      threshold: typeof data.threshold === 'number' ? data.threshold : undefined,
      validFrom: String(data.validFrom),
      validUntil: String(data.validUntil),
      usageLimit: Number(data.usageLimit),
      usedCount: Number(data.usedCount ?? 0),
      minOrderAmount:
        typeof data.minOrderAmount === 'number' ? data.minOrderAmount : undefined,
      maxDiscount: typeof data.maxDiscount === 'number' ? data.maxDiscount : undefined,
      _docPath: docSnap.ref.path,
    });
  });
  return out;
}

export async function fetchAvailableCouponsForUser(
  userId: string,
  opts: AvailabilityOptions = {}
): Promise<Coupon[]> {
  const now = opts.now ?? new Date();
  const [user, allCoupons] = await Promise.all([getUserMetrics(userId), fetchAllCoupons()]);

  const available = allCoupons.filter((c) => isCouponAvailable(c, now));
  const eligible = available.filter((c) => isCouponEligibleForUser(c, user, opts));

  const notApplied: Coupon[] = [];
  for (const coupon of eligible) {
    if (!coupon._docPath) continue;
    const couponDocRef = doc(db, coupon._docPath);
    const applied = await hasUserAppliedCouponInDoc(couponDocRef, userId);
    if (!applied) {
      notApplied.push(coupon);
    }
  }

  return notApplied;
}

export async function fetchCouponByCodeForUser(
  code: string,
  userId: string,
  opts: AvailabilityOptions = {}
): Promise<Coupon | null> {
  const now = opts.now ?? new Date();

  const cg = collectionGroup(db, 'coupons');
  const q1 = query(cg, where('code', '==', code), limit(1));
  const [snap, user] = await Promise.all([getDocs(q1), getUserMetrics(userId)]);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  const data = docSnap.data() as Partial<Coupon>;
  const coupon: Coupon = {
    id: docSnap.id,
    type: data.type as CouponType,
    title: String(data.title),
    code: String(data.code),
    description: data.description ? String(data.description) : undefined,
    isActive: Boolean(data.isActive),
    discountType: data.discountType as DiscountType,
    discountValue: Number(data.discountValue),
    threshold: typeof data.threshold === 'number' ? data.threshold : undefined,
    validFrom: String(data.validFrom),
    validUntil: String(data.validUntil),
    usageLimit: Number(data.usageLimit),
    usedCount: Number(data.usedCount ?? 0),
    minOrderAmount:
      typeof data.minOrderAmount === 'number' ? data.minOrderAmount : undefined,
    maxDiscount: typeof data.maxDiscount === 'number' ? data.maxDiscount : undefined,
    _docPath: docSnap.ref.path,
  };

  const applied = await hasUserAppliedCouponInDoc(docSnap.ref, userId);
  if (!isCouponAvailable(coupon, now)) return null;
  if (!isCouponEligibleForUser(coupon, user, opts)) return null;
  if (applied) return null;

  return coupon;
}

export async function hasUserAppliedCoupon(userId: string, code: string): Promise<boolean> {
  const cg = collectionGroup(db, 'coupons');
  const q1 = query(cg, where('code', '==', code), limit(1));
  const snap = await getDocs(q1);
  if (snap.empty) return false;

  const couponDocRef = snap.docs[0].ref;
  return await hasUserAppliedCouponInDoc(couponDocRef, userId);
}

export async function applyCouponForUser(
  code: string,
  userId: string,
  opts: AvailabilityOptions = {}
): Promise<{ success: boolean; message: string; discount?: number }> {
  const now = opts.now ?? new Date();

  const cg = collectionGroup(db, 'coupons');
  const q1 = query(cg, where('code', '==', code), limit(1));
  const qsnap = await getDocs(q1);
  if (qsnap.empty) {
    return { success: false, message: 'Coupon not found' };
  }
  const couponDocSnap = qsnap.docs[0];
  const couponDocRef = couponDocSnap.ref;

  try {
    let appliedDiscount = 0;

    await runTransaction(db, async (txn) => {
      const cSnap = await txn.get(couponDocRef);

      if (!cSnap.exists()) {
        throw new Error('Coupon not found');
      }

      const userAppliedRef = doc(couponDocRef, 'users', userId);
      const userAppliedSnap = await txn.get(userAppliedRef);

      if (userAppliedSnap.exists() && userAppliedSnap.data()?.applied === true) {
        throw new Error('Coupon already applied by user');
      }

      const userRef = doc(db, 'users', userId);
      const uSnap = await txn.get(userRef);

      const cData = cSnap.data() as Partial<Coupon>;
      const coupon: Coupon = {
        id: cSnap.id,
        type: cData.type as CouponType,
        title: String(cData.title),
        code: String(cData.code),
        description: cData.description ? String(cData.description) : undefined,
        isActive: Boolean(cData.isActive),
        discountType: cData.discountType as DiscountType,
        discountValue: Number(cData.discountValue),
        threshold: typeof cData.threshold === 'number' ? cData.threshold : undefined,
        validFrom: String(cData.validFrom),
        validUntil: String(cData.validUntil),
        usageLimit: Number(cData.usageLimit),
        usedCount: Number(cData.usedCount ?? 0),
        minOrderAmount:
          typeof cData.minOrderAmount === 'number' ? cData.minOrderAmount : undefined,
        maxDiscount:
          typeof cData.maxDiscount === 'number' ? cData.maxDiscount : undefined,
      };

      const userData = uSnap.exists() ? (uSnap.data() as Partial<UserMetrics>) : {};
      const user: UserMetrics = {
        hours: Number(userData.hours ?? 0),
        totalamount: Number(userData.totalamount ?? 0),
      };

      if (!isCouponAvailable(coupon, now)) {
        throw new Error('Coupon not available');
      }
      if (!isCouponEligibleForUser(coupon, user, opts)) {
        throw new Error('User not eligible for coupon');
      }

      const used = Number(coupon.usedCount ?? 0);
      const limitVal = Number(coupon.usageLimit ?? 0);
      if (!(used < limitVal)) {
        throw new Error('Coupon usage limit reached');
      }

      const orderAmount = opts.orderAmount ?? 0;
      if (coupon.discountType === 'percentage') {
        appliedDiscount = (orderAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscount && appliedDiscount > coupon.maxDiscount) {
          appliedDiscount = coupon.maxDiscount;
        }
      } else {
        appliedDiscount = coupon.discountValue;
      }

      txn.update(couponDocRef, { usedCount: increment(1) });

      txn.set(userAppliedRef, {
        applied: true,
        appliedAt: new Date().toISOString(),
        userId: userId,
        discount: appliedDiscount,
      });
    });

    return { 
      success: true, 
      message: 'Coupon applied successfully',
      discount: appliedDiscount
    };
  } catch (e: any) {
    return { success: false, message: e?.message ?? 'Failed to apply coupon' };
  }
}

export function calculateDiscount(coupon: Coupon, orderAmount: number): number {
  if (coupon.discountType === 'percentage') {
    let discount = (orderAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    return discount;
  } else {
    return coupon.discountValue;
  }
}
