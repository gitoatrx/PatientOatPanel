import { XCircle, Calendar, User, CreditCard, Phone } from 'lucide-react';
import { PaymentSessionResponse } from '@/lib/types/api';
import { format } from 'date-fns';

interface PaymentFailedContentProps {
  paymentData: PaymentSessionResponse;
}

export function PaymentFailedContent({ paymentData }: PaymentFailedContentProps) {
  const { data } = paymentData;

  const appointmentDate = new Date(data.appointment.date_and_time);
  const formattedDate = format(appointmentDate, 'EEE, MMM d, yyyy');
  const formattedTime = format(appointmentDate, 'h:mm a');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-sm text-gray-600">We couldn&apos;t process your payment. Review the details below and try again.</p>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {/* Payment */}
          <div className="flex items-center justify-between bg-red-50 rounded p-3">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-red-600" />
              <span className="text-sm text-red-700">Payment</span>
            </div>
            <span className="text-lg font-bold text-red-600">${data.payment.amount}</span>
          </div>

          {/* Appointment */}
          <div className="flex items-center justify-between bg-gray-50 rounded p-3">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">Appointment</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
              <div className="text-xs text-gray-500">{formattedTime}</div>
            </div>
          </div>

          {/* Visit Type */}
          <div className="flex items-center justify-between bg-gray-50 rounded p-3">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">Visit Type</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{data.appointment.visit_type_name}</span>
          </div>

          {/* Doctor */}
          <div className="flex items-center justify-between bg-gray-50 rounded p-3">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">Doctor</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Dr. {data.appointment.doctor.first_name} {data.appointment.doctor.last_name}</span>
          </div>

          {/* Patient */}
          <div className="flex items-center justify-between bg-gray-50 rounded p-3">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">Patient</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{data.patient.first_name} {data.patient.last_name}</span>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between bg-gray-50 rounded p-3">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">Phone</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{data.patient.phone}</span>
          </div>
        </div>

        {/* Help / Next */}
        <div className="mt-6 text-xs text-gray-600">
          If the charge shows up on your card but this page says failed, please wait a minute and refresh. Otherwise, return to checkout to try again.
        </div>
      </div>
    </div>
  );
}


