import { useState } from 'react';
import { Coupon } from '@/lib/coupons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tag, Check } from 'lucide-react';

interface CouponSelectorProps {
  availableCoupons: Coupon[];
  appliedCoupon: Coupon | null;
  onApplyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  onRemoveCoupon: () => void;
  loading?: boolean;
}

export function CouponSelector({
  availableCoupons,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  loading = false,
}: CouponSelectorProps) {
  const [open, setOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  const handleApplyCoupon = async (code: string) => {
    setApplying(true);
    const result = await onApplyCoupon(code);
    setApplying(false);

    if (result.success) {
      toast({
        title: 'Coupon Applied!',
        description: result.message,
      });
      setOpen(false);
      setManualCode('');
    } else {
      toast({
        title: 'Failed to Apply Coupon',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    toast({
      title: 'Coupon Removed',
      description: 'Coupon has been removed from this booking',
    });
  };

  const getCouponTypeLabel = (type: string) => {
    switch (type) {
      case 'festivalAll':
        return 'Festival Offer';
      case 'totalHoursThreshold':
        return 'Loyalty Reward';
      case 'totalAmountThreshold':
        return 'Value Customer';
      case 'singleBookingHoursThreshold':
        return 'Booking Bonus';
      default:
        return 'Special Offer';
    }
  };

  return (
    <div className="space-y-2">
      {appliedCoupon ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">{appliedCoupon.code}</p>
              <p className="text-xs text-green-700">{appliedCoupon.title}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="text-red-600 hover:text-red-700"
          >
            Remove
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          disabled={loading}
          className="w-full"
        >
          <Tag className="w-4 h-4 mr-2" />
          Apply Coupon
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Available Coupons</DialogTitle>
            <DialogDescription>
              Select a coupon or enter a coupon code
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                onClick={() => handleApplyCoupon(manualCode)}
                disabled={!manualCode || applying}
              >
                Apply
              </Button>
            </div>

            {availableCoupons.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Available for you:</p>
                {availableCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                    onClick={() => handleApplyCoupon(coupon.code)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-primary">{coupon.code}</p>
                        <p className="text-sm font-medium">{coupon.title}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getCouponTypeLabel(coupon.type)}
                      </Badge>
                    </div>

                    {coupon.description && (
                      <p className="text-xs text-gray-600 mb-2">{coupon.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% OFF`
                          : `AED ${coupon.discountValue} OFF`}
                      </span>
                      {coupon.maxDiscount && (
                        <span>• Max: AED {coupon.maxDiscount}</span>
                      )}
                      {coupon.minOrderAmount && (
                        <span>• Min: AED {coupon.minOrderAmount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No coupons available at the moment
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
