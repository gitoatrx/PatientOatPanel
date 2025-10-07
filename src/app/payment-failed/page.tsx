'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { patientService } from '@/lib/services/patientService';
import { PaymentSessionResponse } from '@/lib/types/api';
import { PaymentFailedContent } from '@/components/payment/PaymentFailedContent';
import { PaymentSuccessLoading } from '@/components/payment/PaymentSuccessLoading';
import { PaymentSuccessError } from '@/components/payment/PaymentSuccessError';

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [paymentData, setPaymentData] = useState<PaymentSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!sessionId) {
        setError('Session ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await patientService.getPaymentSession(sessionId);

        if (response.success) {
          setPaymentData(response);
        } else {
          setError(response.message || 'Failed to fetch payment data');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Payment session fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentData();
  }, [sessionId]);

  if (isLoading) {
    return <PaymentSuccessLoading />;
  }

  if (error || !paymentData) {
    return <PaymentSuccessError error={error || 'Payment data not found'} />;
  }

  return <PaymentFailedContent paymentData={paymentData} />;
}


