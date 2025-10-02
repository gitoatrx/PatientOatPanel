import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getPreviousAccessibleStepRoute } from "../../config/patient-onboarding-config";

/**
 * Custom hook for smart back navigation that skips completed steps
 */
export function useSmartBackNavigation() {
  const router = useRouter();
  const { state } = usePatientOnboarding();

  const handleSmartBack = (fallbackRoute?: string) => {

    if (!state) {

      // If no state, use fallback or go to login
      router.push(fallbackRoute || "/login");
      return;
    }

    // Get the current step from the state
    const currentStep = state.currentStep;
    const completedSteps = state.completedSteps || [];

    // Get the previous accessible step route
    const previousRoute = getPreviousAccessibleStepRoute(currentStep);

    // If we're at the first step, use fallback
    if (currentStep === 1) {

      router.push(fallbackRoute || "/login");
      return;
    }

    // Navigate to the previous accessible step

    router.push(previousRoute);
  };

  return {
    handleSmartBack,
  };
}
