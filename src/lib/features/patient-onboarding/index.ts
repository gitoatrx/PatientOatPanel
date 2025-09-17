// Context
export {
  PatientOnboardingProvider,
  usePatientOnboarding,
} from "./presentation/context/PatientOnboardingContext";

// Components
export { PatientStepShell } from "./presentation/components/PatientStepShell";
export { PatientPersonalStep } from "./presentation/components/PatientPersonalStep";
export { PatientAddressStep } from "./presentation/components/PatientAddressStep";
export { PatientOnboardingRouteGuard } from "./presentation/components/PatientOnboardingRouteGuard";

// Manager
export { PatientOnboardingManager } from "./application/patient-onboarding-manager";

// Types
export type {
  PatientOnboardingState,
  PatientOnboardingStep,
} from "./application/patient-onboarding-manager";
