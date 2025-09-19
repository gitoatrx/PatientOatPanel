// Removed httpClient and endpoints - not needed in UI-only mode

export {
  patientService,
} from "./patientService";

// Intentionally do not re-export onboardingService here to avoid potential circular deps
