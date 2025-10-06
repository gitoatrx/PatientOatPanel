"use client";

import { useState, useEffect } from "react";
import { useLocationDetection } from "@/lib/hooks/useLocationDetection";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationPermissionRequestProps {
  onLocationDetected?: (city: string) => void;
  onPermissionDenied?: () => void;
  onSkip?: () => void;
  className?: string;
  showSkipOption?: boolean;
  showLoadingState?: boolean;
}

export function LocationPermissionRequest({
  onLocationDetected,
  onPermissionDenied,
  onSkip,
  className,
  showSkipOption = true,
  showLoadingState = true,
}: LocationPermissionRequestProps) {
  const {
    city: detectedCity,
    cityLoading,
    cityError,
    showLocationPopup,
    detectLocation,
    handleEnableLocation,
    setShowLocationPopup,
  } = useLocationDetection();

  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Auto-request location permission when component mounts
  useEffect(() => {
    if (!hasRequestedPermission) {
      setHasRequestedPermission(true);
      detectLocation();
    }
  }, [detectLocation, hasRequestedPermission]);

  // Handle successful location detection
  useEffect(() => {
    if (detectedCity && !cityLoading) {
      // Cache the detected location for later use in address step
      localStorage.setItem('patient-detected-location', detectedCity);
      onLocationDetected?.(detectedCity);
    }
  }, [detectedCity, cityLoading, onLocationDetected]);

  // Handle location permission denied
  useEffect(() => {
    if (cityError && cityError.includes("PERMISSION_DENIED")) {
      onPermissionDenied?.();
    }
  }, [cityError, onPermissionDenied]);

  const handleTryAgain = () => {
    setShowLocationPopup(false);
    handleEnableLocation();
  };

  const handleSkip = () => {
    setShowLocationPopup(false);
    onSkip?.();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Loading state - only show if showLoadingState is true */}
      {cityLoading && showLoadingState && (
        <div className="flex items-center justify-center p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-700 font-medium">
              Detecting your location...
            </span>
          </div>
        </div>
      )}

      {/* Permission popup */}
      {showLocationPopup && (
        <div className="p-6 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-amber-800 font-semibold mb-2">
                Location Access Required
              </h3>
              <p className="text-amber-700 text-sm mb-4">
                We&apos;d like to detect your location to help pre-fill your address information. 
                This will make the onboarding process faster and more convenient.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleTryAgain}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Allow Location Access
                </Button>
                {showSkipOption && (
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Skip for Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {cityError && !showLocationPopup && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 text-sm">
                {cityError.includes("PERMISSION_DENIED")
                  ? "Location access was denied. You can still continue with manual address entry."
                  : cityError}
              </p>
              {showSkipOption && (
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="sm"
                  className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Continue Without Location
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success state */}
      {detectedCity && !cityLoading && !cityError && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span className="text-green-700 text-sm font-medium">
              Location detected: {detectedCity}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
