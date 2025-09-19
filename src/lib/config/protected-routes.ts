/**
 * Protected Routes Configuration
 * Centralized configuration for all protected routes across the application
 */

// Doctor Routes
export const PROTECTED_DOCTOR_ONBOARDING_ROUTES = [
  "/onboarding/doctor/password",
  "/onboarding/doctor/email-verified",
  "/onboarding/doctor/names",
  "/onboarding/doctor/gender",
  "/onboarding/doctor/birthday",
  "/onboarding/doctor/professional",
  "/onboarding/doctor/profile",
  "/onboarding/doctor/files",
  "/onboarding/doctor/payment",
  "/onboarding/doctor/checkout",
  "/onboarding/doctor/complete",
];

export const PROTECTED_DOCTOR_DASHBOARD_ROUTES = [
  "/doctor/dashboard",
  "/doctor/profile",
  "/doctor/settings",
  "/doctor/appointments",
  "/doctor/patients",
];

// Patient Routes
export const PROTECTED_PATIENT_ONBOARDING_ROUTES = [
  "/onboarding/patient/personal",
  "/onboarding/patient/date-of-birth",
  "/onboarding/patient/email",
  "/onboarding/patient/phone",
  "/onboarding/patient/gender",
  "/onboarding/patient/address",
  "/onboarding/patient/health-card",
  "/onboarding/patient/health-concern",
  "/onboarding/patient/emergency-contact",
  "/onboarding/patient/visit-type",
  "/onboarding/patient/doctor-selection",
  "/onboarding/patient/appointment-datetime",
  "/onboarding/patient/review",
];

export const PROTECTED_PATIENT_DASHBOARD_ROUTES = [
  "/patient/dashboard",
  "/patient/profile",
  "/patient/appointments",
  "/patient/medical-history",
  "/patient/prescriptions",
];

// Clinic Routes
export const PROTECTED_CLINIC_ONBOARDING_ROUTES = [
  "/onboarding/clinic/personal",
  "/onboarding/clinic/phone",
  "/onboarding/clinic/details",
  "/onboarding/clinic/payment",
  "/onboarding/clinic/complete",
];

export const PROTECTED_CLINIC_DASHBOARD_ROUTES = [
  "/clinic/dashboard",
  "/clinic/profile",
  "/clinic/settings",
  "/clinic/doctors",
  "/clinic/patients",
  "/clinic/appointments",
  "/clinic/billing",
];

// Combined protected routes for easy middleware usage
export const ALL_PROTECTED_ROUTES = [
  ...PROTECTED_DOCTOR_ONBOARDING_ROUTES,
  ...PROTECTED_DOCTOR_DASHBOARD_ROUTES,
  ...PROTECTED_PATIENT_ONBOARDING_ROUTES,
  ...PROTECTED_PATIENT_DASHBOARD_ROUTES,
  ...PROTECTED_CLINIC_ONBOARDING_ROUTES,
  ...PROTECTED_CLINIC_DASHBOARD_ROUTES,
];

// Route groups for token validation
export const DOCTOR_ROUTES = [
  ...PROTECTED_DOCTOR_ONBOARDING_ROUTES,
  ...PROTECTED_DOCTOR_DASHBOARD_ROUTES,
];

export const PATIENT_ROUTES = [
  ...PROTECTED_PATIENT_ONBOARDING_ROUTES,
  ...PROTECTED_PATIENT_DASHBOARD_ROUTES,
];

export const CLINIC_ROUTES = [
  ...PROTECTED_CLINIC_ONBOARDING_ROUTES,
  ...PROTECTED_CLINIC_DASHBOARD_ROUTES,
];
