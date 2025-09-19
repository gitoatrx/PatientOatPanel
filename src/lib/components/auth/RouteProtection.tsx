"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasActiveSession, getPhoneNumber } from "@/lib/utils/auth-utils";
import { patientService } from "@/lib/services/patientService";
import { getRouteFromApiStep, API_STEP_TO_ROUTE_MAP } from "@/lib/config/api";

interface RouteProtectionProps {
  children: React.ReactNode;
}

export function RouteProtection({ children }: RouteProtectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Skip protection for non-onboarding routes
      if (!pathname.startsWith('/onboarding/patient/')) {
        setIsChecking(false);
        return;
      }

      const isVerified = hasActiveSession();
      const phoneNumber = getPhoneNumber();
      
      console.log('RouteProtection: pathname:', pathname);
      console.log('RouteProtection: isVerified:', isVerified);
      console.log('RouteProtection: phoneNumber:', phoneNumber);

      // If user is verified and trying to access phone/OTP steps, redirect to current step
      // But only redirect from phone step, not from verify-otp step (let them complete verification)
      if (isVerified && phoneNumber) {
        if (pathname === '/onboarding/patient/phone') {
          console.log('RouteProtection: User is verified, redirecting from phone step');
          try {
            console.log('User is already verified, fetching current step...');
            const progressResponse = await patientService.getOnboardingProgress(phoneNumber);
            
            if (progressResponse.success && progressResponse.data) {
              const currentStep = progressResponse.data.current_step;
              console.log('Current step from API:', currentStep);
              
              // Navigate to the step where user left off
              if (currentStep && currentStep !== 'phone' && currentStep !== 'verify-otp') {
                const targetRoute = getRouteFromApiStep(currentStep);
                console.log("=== ROUTE PROTECTION DEBUG ===");
                console.log("API returned current_step:", currentStep);
                console.log("Mapped to route:", targetRoute);
                console.log("Available mappings:", Object.keys(API_STEP_TO_ROUTE_MAP));
                console.log("=============================");
                router.replace(targetRoute);
                return;
              } else {
                // If no valid current step, go to health card as default
                console.log("No valid current step found, defaulting to health card step");
                router.replace("/onboarding/patient/health-card");
                return;
              }
            }
          } catch (error) {
            console.error("Error fetching progress for redirect:", error);
            // Fallback to health card step
            router.replace("/onboarding/patient/health-card");
            return;
          }
        }
      }

      // For all other onboarding routes, just check if user is verified
      // Don't call progress API unless we need to redirect
      // Allow verify-otp step even if user is not verified (they're in the process of verifying)
      if (!isVerified && pathname.startsWith('/onboarding/patient/') && 
          pathname !== '/onboarding/patient/phone' && 
          pathname !== '/onboarding/patient/verify-otp') {
        console.log('User not verified, redirecting to phone step');
        router.replace('/onboarding/patient/phone');
        return;
      }

      setIsChecking(false);
    };

    checkAuthAndRedirect();
  }, [pathname, router]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Checking your session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
