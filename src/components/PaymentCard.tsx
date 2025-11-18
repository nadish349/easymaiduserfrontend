import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface PaymentCardProps {
  amount: number;
  currency?: string;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
  userId?: string;
  bookingId?: string;
  className?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  gateway: string;
}

interface PaymentConfig {
  methods: PaymentMethod[];
  defaultMethod: string;
  testMode: boolean;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  amount,
  currency = 'AED',
  onPaymentSuccess,
  onPaymentError,
  userId,
  bookingId,
  className = ''
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch payment configuration from backend
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      try {
        // Fetch payment configuration from Firestore
        const configRef = doc(db, 'payment_config', 'default');
        const configSnap = await getDoc(configRef);
        
        if (configSnap.exists()) {
          const config = configSnap.data() as PaymentConfig;
          setPaymentConfig(config);
          setSelectedMethod(config.defaultMethod);
        } else {
          // Fallback to default configuration
          const defaultConfig: PaymentConfig = {
            methods: [
              {
                id: 'stripe',
                name: 'Credit Card',
                description: 'Pay with Visa, Mastercard, or American Express',
                icon: '💳',
                isActive: true,
                gateway: 'stripe'
              },
              {
                id: 'paypal',
                name: 'PayPal',
                description: 'Pay with your PayPal account',
                icon: '🔵',
                isActive: true,
                gateway: 'paypal'
              },
              {
                id: 'apple_pay',
                name: 'Apple Pay',
                description: 'Pay with Apple Pay',
                icon: '🍎',
                isActive: false,
                gateway: 'apple_pay'
              },
              {
                id: 'google_pay',
                name: 'Google Pay',
                description: 'Pay with Google Pay',
                icon: '🤖',
                isActive: false,
                gateway: 'google_pay'
              }
            ],
            defaultMethod: 'stripe',
            testMode: true
          };
          setPaymentConfig(defaultConfig);
          setSelectedMethod(defaultConfig.defaultMethod);
        }
      } catch (error) {
        console.error('Error fetching payment config:', error);
        onPaymentError?.('Failed to load payment methods');
      }
    };

    fetchPaymentConfig();
  }, [onPaymentError]);

  const validateCardData = () => {
    const newErrors: Record<string, string> = {};

    if (!cardData.number) {
      newErrors.number = 'Card number is required';
    } else if (!/^\d{16}$/.test(cardData.number.replace(/\s/g, ''))) {
      newErrors.number = 'Invalid card number';
    }

    if (!cardData.expiry) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      newErrors.expiry = 'Invalid expiry date (MM/YY)';
    }

    if (!cardData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cardData.cvv)) {
      newErrors.cvv = 'Invalid CVV';
    }

    if (!cardData.name) {
      newErrors.name = 'Cardholder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardNumberChange = (value: string) => {
    // Format card number with spaces
    const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    setCardData(prev => ({ ...prev, number: formatted }));
  };

  const handleExpiryChange = (value: string) => {
    // Format expiry date
    const formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
    setCardData(prev => ({ ...prev, expiry: formatted }));
  };

  const processPayment = async () => {
    if (!validateCardData()) return;

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Here you would integrate with actual payment gateways
      const paymentData = {
        method: selectedMethod,
        amount,
        currency,
        userId,
        bookingId,
        timestamp: new Date().toISOString(),
        status: 'success',
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      onPaymentSuccess?.(paymentData);
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError?.('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!paymentConfig) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading payment methods...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeMethods = paymentConfig.methods.filter(method => method.isActive);
  const selectedMethodData = activeMethods.find(method => method.id === selectedMethod);

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Lock className="w-4 h-4 mr-1" />
            Secure Payment
          </div>
        </div>
        <div className="text-2xl font-bold">
          {currency} {amount.toFixed(2)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Method Selection */}
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {activeMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  <div className="flex items-center">
                    <span className="mr-2">{method.icon}</span>
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-xs text-muted-foreground">{method.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Credit Card Form */}
        {selectedMethod === 'stripe' && (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              <span className="font-medium">Credit Card Details</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.number}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  maxLength={19}
                  className={errors.number ? 'border-red-500' : ''}
                />
                {errors.number && (
                  <div className="flex items-center text-red-500 text-sm mt-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.number}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardData.expiry}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    maxLength={5}
                    className={errors.expiry ? 'border-red-500' : ''}
                  />
                  {errors.expiry && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.expiry}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardData.cvv}
                    onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                    maxLength={4}
                    className={errors.cvv ? 'border-red-500' : ''}
                  />
                  {errors.cvv && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.cvv}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardData.name}
                  onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <div className="flex items-center text-red-500 text-sm mt-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other Payment Methods Placeholder */}
        {selectedMethod !== 'stripe' && selectedMethodData && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-2">{selectedMethodData.icon}</span>
              <div>
                <div className="font-medium">{selectedMethodData.name}</div>
                <div className="text-sm text-muted-foreground">{selectedMethodData.description}</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedMethodData.gateway} integration will be handled here.
            </div>
          </div>
        )}

        {/* Test Mode Indicator */}
        {paymentConfig.testMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center text-yellow-800">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Test Mode</span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              This is a test environment. No real payments will be processed.
            </p>
          </div>
        )}

        {/* Pay Button */}
        <Button
          onClick={processPayment}
          disabled={processing || !selectedMethod}
          className="w-full"
        >
          {processing ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay ${currency} ${amount.toFixed(2)}`
          )}
        </Button>

        {/* Security Notice */}
        <div className="text-xs text-muted-foreground text-center">
          Your payment information is encrypted and secure. We never store your card details.
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentCard; 