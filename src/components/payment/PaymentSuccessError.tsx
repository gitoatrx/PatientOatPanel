import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface PaymentSuccessErrorProps {
  error: string;
}

export function PaymentSuccessError({ error }: PaymentSuccessErrorProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Payment Error
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          {error}
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center space-x-3 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center space-x-3 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Return Home</span>
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 mt-8">
          If this problem persists, please contact our support team.
        </p>
      </div>
    </div>
  );
}
