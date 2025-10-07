import { CheckCircle, Loader2 } from 'lucide-react';

export function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="relative inline-block">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <Loader2 className="w-6 h-6 text-green-500 animate-spin absolute -bottom-1 -right-1" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Processing Payment
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Please wait while we verify your payment details...
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3 text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Verifying payment</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-gray-500">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span>Loading appointment details</span>
          </div>
        </div>
      </div>
    </div>
  );
}
