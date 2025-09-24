"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Mic, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  error?: string;
}

export function PermissionRequestModal({
  isOpen,
  onClose,
  onRetry,
  error,
}: PermissionRequestModalProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Shield className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-xl">Camera & Microphone Access Required</CardTitle>
          <CardDescription>
            We need access to your camera and microphone to start your video consultation.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Permission Icons */}
          <div className="flex justify-center space-x-8">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Camera</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mic className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium">Microphone</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                     <span>Click &quot;Allow&quot; when your browser asks for permission</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Make sure you&apos;re using HTTPS (secure connection)</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Check that your camera and microphone aren&apos;t being used by other apps</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>If no dialog appears, check your browser&apos;s address bar for a camera/mic icon</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Permission Denied</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1 bg-[#1B58F5] hover:bg-[#1547c9]"
            >
              {isRetrying ? "Requesting..." : "Allow Access"}
            </Button>
          </div>

          {/* Alternative Solution */}
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Still not working? Try refreshing the page
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Having trouble? Try refreshing the page or check your browser settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
