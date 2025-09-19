"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
// Removed authentication dependency for UI-only mode
// Removed ROUTES import for UI-only mode
import {
  // PATH_TO_STEP_MAP,
  getRouteFromStepNumber,
  getStepNumberFromRoute,
  shouldSkipStep,
  getNextAccessibleStep,
  PATIENT_ONBOARDING_STEPS,
} from "../../config/patient-onboarding-config";

interface PatientOnboardingRouteGuardProps {
  children: React.ReactNode;
  requiredStep?: number;
}

export function PatientOnboardingRouteGuard({
  children,
  requiredStep,
}: PatientOnboardingRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isLoading } = usePatientOnboarding();
  // const [isChecking, setIsChecking] = useState(true); // Start as true to prevent flash
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Extract step number from pathname using centralized config
  const getStepFromPath = (path: string): number => {
    return getStepNumberFromRoute(path);
  };

  const currentRequiredStep = requiredStep || getStepFromPath(pathname);

  // In UI-only mode, always authorize and disable all route restrictions
  useEffect(() => {
    console.log("PatientOnboardingRouteGuard: UI-only mode - authorizing access (route guard disabled for testing)");
    setIsAuthorized(true);
  }, []);

  // Disabled route guard logic for UI testing
  // useEffect(() => {
  //   const checkAccess = async () => {
  //     try {
  //       // Only proceed if we passed the immediate auth check
  //       if (!isAuthorized) return;

  //       // In UI-only mode, just log the state
  //       console.log("PatientOnboardingRouteGuard: UI-only mode - checking access", {
  //         state,
  //         currentRequiredStep,
  //         isLoading
  //       });

  //       // Check if onboarding is complete
  //       if (state?.isComplete) {
  //         console.log("PatientOnboardingRouteGuard: Onboarding complete, staying on current page");
  //         return;
  //       }

  //       // Check step access using centralized config
  //       // Allow users to go back to previous steps for editing
  //       if (state && currentRequiredStep > state.currentStep) {
  //         // Get the correct route for the current step using centralized config
  //         const currentStepRoute = getRouteFromStepNumber(state.currentStep);
  //         console.log("PatientOnboardingRouteGuard: Redirecting to current step:", currentStepRoute);
  //         router.push(currentStepRoute);
  //         return;
  //       }

  //       // Check if current step should be skipped (already completed)
  //       if (state && state.completedSteps && currentRequiredStep) {
  //         const currentStepConfig = PATIENT_ONBOARDING_STEPS.find(
  //           (step) => step.id === currentRequiredStep,
  //         );
  //         if (
  //           currentStepConfig &&
  //           shouldSkipStep(currentStepConfig.name, state.completedSteps)
  //         ) {
  //           // Find the next accessible step
  //           const nextStep = getNextAccessibleStep(
  //             currentRequiredStep,
  //             state.completedSteps,
  //           );
  //           if (nextStep !== currentRequiredStep) {
  //             const nextStepRoute = getRouteFromStepNumber(nextStep);
  //             console.log("PatientOnboardingRouteGuard: Skipping completed step, redirecting to:", nextStepRoute);
  //             router.push(nextStepRoute);
  //             return;
  //           }
  //         }
  //       }

  //     } catch (err) {
  //       console.error("Route guard error:", err);
  //       // In UI-only mode, don't redirect to login, just log the error
  //       console.log("PatientOnboardingRouteGuard: Error in UI-only mode, continuing");
  //     }
  //   };

  //   if (!isLoading && state !== null && isAuthorized) {
  //     checkAccess();
  //   }
  // }, [router, state, isLoading, currentRequiredStep, isAuthorized]);

  // Show loading only when absolutely necessary (initial load or critical checks)
  // Commented out gradient background loader to prevent flicker
  // if (isLoading && !state) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Show error if there's an error state
  // Commented out gradient background error state to prevent flicker
  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="text-red-600 mb-4">
  //           <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
  //           </svg>
  //         </div>
  //         <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
  //         <p className="text-gray-600 mb-4">{error}</p>
  //         <button
  //           onClick={() => window.location.reload()}
  //           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  //         >
  //           Try Again
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // Render children if all checks pass
  return <>{children}</>;
}
