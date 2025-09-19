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
    console.log(
      "useSmartBackNavigation: handleSmartBack called with fallbackRoute:",
      fallbackRoute,
    );
    console.log("useSmartBackNavigation: current state:", state);

    if (!state) {
      console.log("useSmartBackNavigation: No state, using fallback route");
      // If no state, use fallback or go to login
      router.push(fallbackRoute || "/login");
      return;
    }

    // Get the current step from the state
    const currentStep = state.currentStep;
    const completedSteps = state.completedSteps || [];

    console.log(
      "useSmartBackNavigation: currentStep:",
      currentStep,
      "completedSteps:",
      completedSteps,
    );

    // Get the previous accessible step route
    const previousRoute = getPreviousAccessibleStepRoute(currentStep);

    console.log("useSmartBackNavigation: previousRoute:", previousRoute);

    // If we're at the first step, use fallback
    if (currentStep === 1) {
      console.log(
        "useSmartBackNavigation: At first step, using fallback route",
      );
      router.push(fallbackRoute || "/login");
      return;
    }

    // Navigate to the previous accessible step
    console.log(
      "useSmartBackNavigation: Navigating to previous route:",
      previousRoute,
    );
    router.push(previousRoute);
  };

  return {
    handleSmartBack,
  };
}
