"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasActiveSession, getPhoneNumber } from "@/lib/utils/auth-utils";
import { patientService } from "@/lib/services/patientService";

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

      // If user is verified and trying to access phone/OTP steps, redirect to current step
      if (isVerified && phoneNumber) {
        if (pathname === '/onboarding/patient/phone' || pathname === '/onboarding/patient/verify-otp') {
          try {
            console.log('User is already verified, fetching current step...');
            const progressResponse = await patientService.getOnboardingProgress(phoneNumber);
            
            if (progressResponse.success && progressResponse.data) {
              const currentStep = progressResponse.data.current_step;
              console.log('Current step from API:', currentStep);
              
              // Map API step names to correct routes
              const stepRouteMapping: Record<string, string> = {
                'personal_info_step1': '/onboarding/patient/personal',
                'personal': '/onboarding/patient/personal',
                'gender': '/onboarding/patient/gender',
                'date_of_birth': '/onboarding/patient/date-of-birth',
                'email': '/onboarding/patient/email',
                'address': '/onboarding/patient/address',
                'health_concern': '/onboarding/patient/health-concern',
                'health_concerns': '/onboarding/patient/health-concern',
                'visit_type': '/onboarding/patient/visit-type',
                'emergency_contact': '/onboarding/patient/emergency-contact',
                'doctor_selection': '/onboarding/patient/doctor-selection',
                'provider_selection': '/onboarding/patient/doctor-selection',
                'appointment_datetime': '/onboarding/patient/appointment-datetime',
                'appointment_date': '/onboarding/patient/appointment-datetime',
                'review': '/onboarding/patient/review',
                'confirmation': '/onboarding/patient/confirmation',
              };

              // Navigate to the step where user left off
              if (currentStep && currentStep !== 'phone' && currentStep !== 'verify-otp') {
                const targetRoute = stepRouteMapping[currentStep] || `/onboarding/patient/${currentStep}`;
                console.log("Redirecting verified user to:", targetRoute);
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
      if (!isVerified && pathname.startsWith('/onboarding/patient/') && 
          pathname !== '/onboarding/patient/phone') {
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
