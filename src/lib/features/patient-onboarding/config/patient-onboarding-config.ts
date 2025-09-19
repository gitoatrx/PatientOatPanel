/**
 * Centralized Patient Onboarding Configuration
 *
 * This file contains all patient onboarding step definitions, routes, and mappings.
 * Update this single file to change the entire onboarding flow.
 */

// Define routes locally to avoid circular dependency
const PATIENT_ONBOARDING_ROUTES = {
  PHONE: "/onboarding/patient/phone",
  VERIFY_OTP: "/onboarding/patient/verify-otp",
  HEALTH_CARD: "/onboarding/patient/health-card",
  PERSONAL: "/onboarding/patient/personal",
  GENDER: "/onboarding/patient/gender",
  DATE_OF_BIRTH: "/onboarding/patient/date-of-birth",
  EMAIL: "/onboarding/patient/email",
  ADDRESS: "/onboarding/patient/address",
  HEALTH_CONCERN: "/onboarding/patient/health-concern",
  VISIT_TYPE: "/onboarding/patient/visit-type",
  EMERGENCY_CONTACT: "/onboarding/patient/emergency-contact",
  DOCTOR_SELECTION: "/onboarding/patient/doctor-selection",
  APPOINTMENT_DATETIME: "/onboarding/patient/appointment-datetime",
  REVIEW: "/onboarding/patient/review",
  CONFIRMATION: "/onboarding/patient/confirmation",
} as const;

// Step configuration interface with readonly properties for type safety
export interface PatientOnboardingStepConfig {
  readonly id: number;
  readonly name: string;
  readonly title: string;
  readonly route: string;
  readonly apiStepName: string;
  readonly isCompleted: boolean;
  readonly isAccessible: boolean;
}

// Centralized step configuration - readonly array for immutability
export const PATIENT_ONBOARDING_STEPS: readonly PatientOnboardingStepConfig[] =
  [
    {
      id: 1,
      name: "phone",
      title: "Phone Number",
      route: PATIENT_ONBOARDING_ROUTES.PHONE,
      apiStepName: "PHONE",
      isCompleted: false,
      isAccessible: true,
    },
    {
      id: 2,
      name: "verifyOtp",
      title: "Verify OTP",
      route: PATIENT_ONBOARDING_ROUTES.VERIFY_OTP,
      apiStepName: "VERIFY_OTP",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 3,
      name: "healthCard",
      title: "Health Card",
      route: PATIENT_ONBOARDING_ROUTES.HEALTH_CARD,
      apiStepName: "HEALTH_CARD",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 4,
      name: "personal",
      title: "Your Name",
      route: PATIENT_ONBOARDING_ROUTES.PERSONAL,
      apiStepName: "PERSONAL",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 5,
      name: "gender",
      title: "Gender",
      route: PATIENT_ONBOARDING_ROUTES.GENDER,
      apiStepName: "GENDER",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 6,
      name: "dateOfBirth",
      title: "Date of Birth",
      route: PATIENT_ONBOARDING_ROUTES.DATE_OF_BIRTH,
      apiStepName: "DATE_OF_BIRTH",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 7,
      name: "email",
      title: "Email Address",
      route: PATIENT_ONBOARDING_ROUTES.EMAIL,
      apiStepName: "EMAIL",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 8,
      name: "address",
      title: "Address",
      route: PATIENT_ONBOARDING_ROUTES.ADDRESS,
      apiStepName: "ADDRESS",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 9,
      name: "healthConcern",
      title: "Health Concern",
      route: PATIENT_ONBOARDING_ROUTES.HEALTH_CONCERN,
      apiStepName: "HEALTH_CONCERN",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 10,
      name: "visitType",
      title: "Visit Type",
      route: PATIENT_ONBOARDING_ROUTES.VISIT_TYPE,
      apiStepName: "VISIT_TYPE",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 11,
      name: "emergencyContact",
      title: "Emergency Contact",
      route: PATIENT_ONBOARDING_ROUTES.EMERGENCY_CONTACT,
      apiStepName: "EMERGENCY_CONTACT",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 12,
      name: "doctorSelection",
      title: "Choose Your Doctor",
      route: PATIENT_ONBOARDING_ROUTES.DOCTOR_SELECTION,
      apiStepName: "DOCTOR_SELECTION",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 13,
      name: "appointmentDateTime",
      title: "Choose Date & Time",
      route: PATIENT_ONBOARDING_ROUTES.APPOINTMENT_DATETIME,
      apiStepName: "APPOINTMENT_DATETIME",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 14,
      name: "review",
      title: "Review & Book",
      route: PATIENT_ONBOARDING_ROUTES.REVIEW,
      apiStepName: "REVIEW",
      isCompleted: false,
      isAccessible: false,
    },
    {
      id: 15,
      name: "confirmation",
      title: "Appointment Confirmed",
      route: PATIENT_ONBOARDING_ROUTES.CONFIRMATION,
      apiStepName: "CONFIRMATION",
      isCompleted: false,
      isAccessible: false,
    },
  ] as const;

// Type-safe helper functions
export const getStepByNumber = (
  stepNumber: number,
): PatientOnboardingStepConfig | undefined => {
  return PATIENT_ONBOARDING_STEPS.find((step) => step.id === stepNumber);
};

export const getStepByName = (
  stepName: string,
): PatientOnboardingStepConfig | undefined => {
  return PATIENT_ONBOARDING_STEPS.find((step) => step.name === stepName);
};

export const getStepByRoute = (
  route: string,
): PatientOnboardingStepConfig | undefined => {
  return PATIENT_ONBOARDING_STEPS.find((step) => step.route === route);
};

export const getStepByApiName = (
  apiStepName: string,
): PatientOnboardingStepConfig | undefined => {
  return PATIENT_ONBOARDING_STEPS.find(
    (step) => step.apiStepName === apiStepName,
  );
};

// Navigation helper functions
export const getNextStep = (
  currentStepNumber: number,
): PatientOnboardingStepConfig | null => {
  const currentIndex = PATIENT_ONBOARDING_STEPS.findIndex(
    (step) => step.id === currentStepNumber,
  );
  if (
    currentIndex === -1 ||
    currentIndex === PATIENT_ONBOARDING_STEPS.length - 1
  ) {
    return null;
  }
  return PATIENT_ONBOARDING_STEPS[currentIndex + 1];
};

export const getPreviousStep = (
  currentStepNumber: number,
): PatientOnboardingStepConfig | null => {
  const currentIndex = PATIENT_ONBOARDING_STEPS.findIndex(
    (step) => step.id === currentStepNumber,
  );
  if (currentIndex <= 0) {
    return null;
  }
  return PATIENT_ONBOARDING_STEPS[currentIndex - 1];
};

// Conversion helper functions
export const getStepNumberFromRoute = (route: string): number => {
  const step = getStepByRoute(route);
  return step?.id || 1;
};

export const getStepNumberFromApiName = (apiStepName: string): number => {
  const step = getStepByApiName(apiStepName);
  return step?.id || 1;
};

export const getRouteFromStepNumber = (stepNumber: number): string => {
  const step = getStepByNumber(stepNumber);
  return step?.route || PATIENT_ONBOARDING_ROUTES.HEALTH_CARD;
};

export const getApiStepNameFromStepNumber = (stepNumber: number): string => {
  const step = getStepByNumber(stepNumber);
  return step?.apiStepName || "HEALTH_CARD";
};

// Array helper functions
export const getAllRoutes = (): readonly string[] => {
  return PATIENT_ONBOARDING_STEPS.map((step) => step.route);
};

export const getAllApiStepNames = (): readonly string[] => {
  return PATIENT_ONBOARDING_STEPS.map((step) => step.apiStepName);
};

// Mapping objects for backward compatibility
export const PATIENT_STEP_MAPPING: Record<number, string> = (() => {
  const map: Record<number, string> = {};
  PATIENT_ONBOARDING_STEPS.forEach((step) => {
    map[step.id] = step.apiStepName;
  });
  return map;
})();

export const PATH_TO_STEP_MAP: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  PATIENT_ONBOARDING_STEPS.forEach((step) => {
    map[step.route] = step.id;
  });
  return map;
})();

export const STEP_TO_ROUTE_MAP: Record<number, string> = (() => {
  const map: Record<number, string> = {};
  PATIENT_ONBOARDING_STEPS.forEach((step) => {
    map[step.id] = step.route;
  });
  return map;
})();

// Type definitions for better TypeScript support
export type PatientOnboardingStepName =
  (typeof PATIENT_ONBOARDING_STEPS)[number]["name"];
export type PatientOnboardingStepId =
  (typeof PATIENT_ONBOARDING_STEPS)[number]["id"];
export type PatientOnboardingApiStepName =
  (typeof PATIENT_ONBOARDING_STEPS)[number]["apiStepName"];

// Enhanced helper functions for step components
export const getStepConfig = (
  stepName: PatientOnboardingStepName,
): PatientOnboardingStepConfig => {
  const step = getStepByName(stepName);
  if (!step) {
    throw new Error(`Step configuration not found for: ${stepName}`);
  }
  return step;
};

export const getStepId = (stepName: PatientOnboardingStepName): number => {
  return getStepConfig(stepName).id;
};

export const getStepProgress = (
  stepName: PatientOnboardingStepName,
): number => {
  const step = getStepConfig(stepName);
  return Math.round((step.id / PATIENT_ONBOARDING_STEPS.length) * 100);
};

export const getTotalSteps = (): number => {
  return PATIENT_ONBOARDING_STEPS.length;
};

// Helper for step components to get all necessary data
export const getStepComponentData = (stepName: PatientOnboardingStepName) => {
  const step = getStepConfig(stepName);
  return {
    stepId: step.id,
    stepName: step.name,
    stepTitle: step.title,
    stepRoute: step.route,
    apiStepName: step.apiStepName,
    progressPercent: getStepProgress(stepName),
    currentStep: step.id,
    totalSteps: getTotalSteps(),
    isAccessible: step.isAccessible,
    isCompleted: step.isCompleted,
  };
};

// ✅ NEW: Helper functions for step skipping logic
export const isStepCompleted = (
  stepName: PatientOnboardingStepName,
  completedSteps: string[],
): boolean => {
  const step = getStepConfig(stepName);
  return completedSteps.includes(step.apiStepName);
};

export const getNextAccessibleStep = (
  currentStep: number,
  completedSteps: string[],
): number => {
  // Find the next step that is not completed
  for (let i = currentStep + 1; i <= PATIENT_ONBOARDING_STEPS.length; i++) {
    const step = PATIENT_ONBOARDING_STEPS.find((s) => s.id === i);
    if (step && !isStepCompleted(step.name, completedSteps)) {
      return i;
    }
  }
  return currentStep; // Return current step if no next step found
};

export const shouldSkipStep = (
  stepName: PatientOnboardingStepName,
  completedSteps: string[],
): boolean => {
  return isStepCompleted(stepName, completedSteps);
};

export const getCompletedStepsCount = (completedSteps: string[]): number => {
  return completedSteps.length;
};

export const getRemainingStepsCount = (completedSteps: string[]): number => {
  return getTotalSteps() - getCompletedStepsCount(completedSteps);
};

// ✅ FIXED: Helper function to get the previous accessible step (for back button)
export const getPreviousAccessibleStep = (currentStep: number): number => {
  // Find the previous step that is accessible for back navigation
  // Users should be able to go back to any previous step for editing,
  // regardless of completion status
  for (let i = currentStep - 1; i >= 1; i--) {
    const step = PATIENT_ONBOARDING_STEPS.find((s) => s.id === i);
    if (step) {
      // Allow navigation to any previous step for editing purposes
      return i;
    }
  }
  return currentStep; // Return current step if no previous step found
};

// ✅ NEW: Helper function to get the previous accessible step route
export const getPreviousAccessibleStepRoute = (currentStep: number): string => {
  const previousStep = getPreviousAccessibleStep(currentStep);
  return getRouteFromStepNumber(previousStep);
};
