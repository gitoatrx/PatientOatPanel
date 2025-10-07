import { CheckCircle, Calendar, User, CreditCard, Phone } from 'lucide-react';
import { PaymentSessionResponse } from '@/lib/types/api';
import { format } from 'date-fns';

interface PaymentSuccessContentProps {
  paymentData: PaymentSessionResponse;
}

export function PaymentSuccessContent({ paymentData }: PaymentSuccessContentProps) {
  const { data } = paymentData;
  
  // Format the appointment date and time
  const appointmentDate = new Date(data.appointment.date_and_time);
  const formattedDate = format(appointmentDate, 'EEE, MMM d, yyyy');
  const formattedTime = format(appointmentDate, 'h:mm a');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-4">
            Your appointment has been confirmed and payment processed successfully.
          </p>
          
          <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
            <CreditCard className="w-4 h-4" />
            <span>${data.payment.amount} paid</span>
          </div>
        </div>

        {/* Flat single-row list (no cards) */}
        <div className="space-y-2">
          {/* Payment */}
          <div className="flex items-center justify-between bg-green-50 rounded p-3">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-sm text-green-700">Payment</span>
            </div>
            <span className="text-lg font-bold text-green-600">${data.payment.amount}</span>
          </div>

          {/* Appointment (date + time combined) */}
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

          {/* Visit type */}
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
          {/* <div className="flex items-center justify-between bg-gray-50 rounded p-3">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">Patient</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{data.patient.first_name} {data.patient.last_name}</span>
          </div> */}

          {/* Phone */}
          {/* <div className="flex items-center justify-between bg-gray-50 rounded p-3">
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">Phone</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{data.patient.phone}</span>
          </div> */}
        </div>

        {/* Next Steps (flat, subtle) */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">What&apos;s Next?</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-xs">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Confirmation Email</p>
                <p className="text-gray-600 text-xs">
                  You will receive a confirmation email with your appointment details.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-xs">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Reminder Notifications</p>
                <p className="text-gray-600 text-xs">
                  We&apos;ll send you reminders before your appointment.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-xs">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Prepare for Your Visit</p>
                <p className="text-gray-600 text-xs">
                  Please arrive 15 minutes early and bring a valid ID.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
