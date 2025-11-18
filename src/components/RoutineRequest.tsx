import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface RoutineRequestProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const RoutineRequest: React.FC<RoutineRequestProps> = ({ isOpen, onClose, userId }) => {
  const [plan, setPlan] = useState<'weekly' | 'monthly' | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'online' | null>(null);
  const [cancel, setCancel] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    // If cancel is selected, we don't need plan and payment type
    if (!cancel && (!plan || !paymentType)) {
      toast({
        title: "Missing Information",
        description: "Please select both plan and payment type.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const requestData = {
        createdAt: serverTimestamp(),
        paymentType: cancel ? null : paymentType,
        plan: cancel ? null : plan,
        status: 'pending',
        userId,
        cancel,
      };

      await addDoc(collection(db, 'request_subscriptions'), requestData);

             toast({
         title: cancel ? "Cancellation Request Submitted!" : "Request Submitted!",
         description: cancel 
           ? "Your routine cleaning cancellation request has been submitted successfully."
           : "Your routine cleaning request has been submitted successfully.",
       });

             // Reset form and close modal
       setPlan(null);
       setPaymentType(null);
       setCancel(false);
       onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Request Failed",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Routine Cleaning Request</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Plan Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Select Plan</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="plan"
                    value="weekly"
                    checked={plan === 'weekly'}
                    onChange={() => setPlan('weekly')}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    plan === 'weekly' 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {plan === 'weekly' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className="text-gray-700">Weekly</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="plan"
                    value="monthly"
                    checked={plan === 'monthly'}
                    onChange={() => setPlan('monthly')}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    plan === 'monthly' 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {plan === 'monthly' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className="text-gray-700">Monthly</span>
              </label>
            </div>
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Payment Type</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="paymentType"
                    value="cash"
                    checked={paymentType === 'cash'}
                    onChange={() => setPaymentType('cash')}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'cash' 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {paymentType === 'cash' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className="text-gray-700">Cash</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="paymentType"
                    value="card"
                    checked={paymentType === 'card'}
                    onChange={() => setPaymentType('card')}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'card' 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {paymentType === 'card' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className="text-gray-700">Card</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="radio"
                    name="paymentType"
                    value="online"
                    checked={paymentType === 'online'}
                    onChange={() => setPaymentType('online')}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentType === 'online' 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {paymentType === 'online' && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <span className="text-gray-700">Online</span>
              </label>
                       </div>
         </div>

                   {/* Cancel Request Option */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Request Options</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={cancel}
                    onChange={(e) => setCancel(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    cancel 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                  }`}>
                    {cancel && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-gray-700">I want to cancel my routine cleaning request</span>
              </label>
            </div>
          </div>

         {/* Staff Notification */}
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
           <div className="flex items-start space-x-3">
             <div className="flex-shrink-0">
               <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
               </svg>
             </div>
             <div className="text-sm text-blue-800">
               <p className="font-medium">Staff will let you know once your request is accepted</p>
             </div>
           </div>
         </div>

         {/* Submit Button */}
                     <Button
             onClick={handleSubmit}
             disabled={(!cancel && (!plan || !paymentType)) || isSubmitting}
             className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-3 rounded-lg hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isSubmitting ? 'Submitting...' : (cancel ? 'Submit Cancellation Request' : 'Submit Request')}
           </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutineRequest; 