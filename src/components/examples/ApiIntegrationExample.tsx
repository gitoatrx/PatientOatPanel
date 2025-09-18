"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { patientService } from '@/lib/services/patientService';

export function ApiIntegrationExample() {
  const [phone, setPhone] = useState('+919924237000');
  const [otp, setOtp] = useState('506691');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSendOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await patientService.sendOtp(phone);
      setResult({ type: 'sendOtp', response });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testVerifyOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await patientService.verifyOtp(phone, otp);
      setResult({ type: 'verifyOtp', response });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">OTP Code:</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter OTP code"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testSendOtp} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Test Send OTP'}
            </Button>
            
            <Button 
              onClick={testVerifyOtp} 
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Test Verify OTP'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <strong>Result ({result.type}):</strong>
              <pre className="mt-2 text-sm overflow-auto">
                {JSON.stringify(result.response, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}