/**
 * Centralized Routes Configuration
 *
 * This file contains all application routes to avoid hardcoded strings
 * throughout the codebase. Update routes here to change them globally.
 */

// Note: Patient onboarding routes are now defined in the centralized config
// to avoid circular dependencies

// Base routes
export const ROUTES = {
  // Public routes
  HOME: "/",
  CONTACT_US: "/contact-us",
  HOW_IT_WORKS: "/how-it-works",
  FOR_PROVIDER: "/for-provider",
  PROVIDERS: "/providers",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  COOKIES: "/cookies",

  // Authentication routes
  AUTH: {
    LOGIN: "/login",
    LOGIN_CLINIC: "/login/clinic",
    LOGIN_DOCTOR: "/login/doctor",
    REGISTER: "/register",
    REGISTER_CLINIC: "/register/clinic",
    REGISTER_DOCTOR: "/register/doctor",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    WELCOME: "/welcome",
  },

  // Dashboard routes
  DASHBOARD: {
    MAIN: "/dashboard",
    CLINIC: "/clinic/dashboard",
    DOCTOR: "/doctor/dashboard",
    PATIENT: "/patient/dashboard",
  },

  // Onboarding routes
  ONBOARDING: {
    MAIN: "/onboarding",

    // Clinic onboarding
    CLINIC: {
      BASE: "/onboarding/clinic",
      PERSONAL: "/onboarding/clinic/personal",
      DETAILS: "/onboarding/clinic/details",
      PHONE: "/onboarding/clinic/phone",
      PAYMENT: "/onboarding/clinic/payment",
      PAYMENT_SUCCESS: "/onboarding/clinic/payment-success",
      PAYMENT_CANCEL: "/onboarding/clinic/payment-cancel",
      COMPLETE: "/onboarding/clinic/complete",
    },

    // Doctor onboarding
    DOCTOR: {
      BASE: "/onboarding/doctor",
      NAMES: "/onboarding/doctor/names",
      BIRTHDAY: "/onboarding/doctor/birthday",
      GENDER: "/onboarding/doctor/gender",
      PROFESSIONAL: "/onboarding/doctor/professional",
      PRACTICE_ADDRESS: "/onboarding/doctor/practice-address",
      FILES: "/onboarding/doctor/files",
      LICENSE: "/onboarding/doctor/license",
      PAYMENT: "/onboarding/doctor/payment",
      COMPLETE: "/onboarding/doctor/complete",
    },

    // Patient onboarding
    PATIENT: {
      BASE: "/onboarding/patient",
      PERSONAL: "/onboarding/patient/personal",
      DATE_OF_BIRTH: "/onboarding/patient/date-of-birth",
      EMAIL: "/onboarding/patient/email",
      PHONE: "/onboarding/patient/phone",
      GENDER: "/onboarding/patient/gender",
      ADDRESS: "/onboarding/patient/address",
      HEALTH_CARD: "/onboarding/patient/health-card",
      HEALTH_CONCERN: "/onboarding/patient/health-concern",
      EMERGENCY_CONTACT: "/onboarding/patient/emergency-contact",
      VISIT_TYPE: "/onboarding/patient/visit-type",
      DOCTOR_SELECTION: "/onboarding/patient/doctor-selection",
      APPOINTMENT_DATETIME: "/onboarding/patient/appointment-datetime",
      REVIEW: "/onboarding/patient/review",
    },
  },

  // Payment routes
  PAYMENT: {
    SUCCESS: "/payment/success",
    CANCEL: "/payment/cancel",
  },

  // API routes
  API: {
    PLACES: "/api/places",
  },
} as const;

// Route helper functions
export const routeHelpers = {
  /**
   * Get clinic onboarding route by step
   */
  getClinicOnboardingRoute: (step: keyof typeof ROUTES.ONBOARDING.CLINIC) => {
    return ROUTES.ONBOARDING.CLINIC[step];
  },

  /**
   * Get doctor onboarding route by step
   */
  getDoctorOnboardingRoute: (step: keyof typeof ROUTES.ONBOARDING.DOCTOR) => {
    return ROUTES.ONBOARDING.DOCTOR[step];
  },

  /**
   * Get patient onboarding route by step
   */
  getPatientOnboardingRoute: (step: keyof typeof ROUTES.ONBOARDING.PATIENT) => {
    return ROUTES.ONBOARDING.PATIENT[step];
  },

  /**
   * Get auth route by type
   */
  getAuthRoute: (type: keyof typeof ROUTES.AUTH) => {
    return ROUTES.AUTH[type];
  },

  /**
   * Get dashboard route by type
   */
  getDashboardRoute: (type: keyof typeof ROUTES.DASHBOARD) => {
    return ROUTES.DASHBOARD[type];
  },

  /**
   * Check if a route is an onboarding route
   */
  isOnboardingRoute: (pathname: string): boolean => {
    return pathname.startsWith(ROUTES.ONBOARDING.MAIN);
  },

  /**
   * Check if a route is a dashboard route
   */
  isDashboardRoute: (pathname: string): boolean => {
    return Object.values(ROUTES.DASHBOARD).includes(
      pathname as (typeof ROUTES.DASHBOARD)[keyof typeof ROUTES.DASHBOARD],
    );
  },

  /**
   * Check if a route is an auth route
   */
  isAuthRoute: (pathname: string): boolean => {
    return Object.values(ROUTES.AUTH).includes(
      pathname as (typeof ROUTES.AUTH)[keyof typeof ROUTES.AUTH],
    );
  },

  /**
   * Get the next step in clinic onboarding flow
   */
  getNextClinicOnboardingStep: (currentStep: string): string | null => {
    const steps = [
      ROUTES.ONBOARDING.CLINIC.PERSONAL,
      ROUTES.ONBOARDING.CLINIC.DETAILS,
      ROUTES.ONBOARDING.CLINIC.PHONE,
      ROUTES.ONBOARDING.CLINIC.PAYMENT,
      ROUTES.ONBOARDING.CLINIC.COMPLETE,
    ];

    const currentIndex = steps.indexOf(currentStep as (typeof steps)[number]);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  },

  /**
   * Get the next step in doctor onboarding flow
   */
  getNextDoctorOnboardingStep: (currentStep: string): string | null => {
    const steps = [
      ROUTES.ONBOARDING.DOCTOR.NAMES,
      ROUTES.ONBOARDING.DOCTOR.BIRTHDAY,
      ROUTES.ONBOARDING.DOCTOR.GENDER,
      ROUTES.ONBOARDING.DOCTOR.PROFESSIONAL,
      ROUTES.ONBOARDING.DOCTOR.PRACTICE_ADDRESS,
      ROUTES.ONBOARDING.DOCTOR.FILES,
      ROUTES.ONBOARDING.DOCTOR.LICENSE,
      ROUTES.ONBOARDING.DOCTOR.PAYMENT,
      ROUTES.ONBOARDING.DOCTOR.COMPLETE,
    ];

    const currentIndex = steps.indexOf(currentStep as (typeof steps)[number]);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  },

  /**
   * Get the previous step in clinic onboarding flow
   */
  getPreviousClinicOnboardingStep: (currentStep: string): string | null => {
    const steps = [
      ROUTES.ONBOARDING.CLINIC.PERSONAL,
      ROUTES.ONBOARDING.CLINIC.DETAILS,
      ROUTES.ONBOARDING.CLINIC.PHONE,
      ROUTES.ONBOARDING.CLINIC.PAYMENT,
      ROUTES.ONBOARDING.CLINIC.COMPLETE,
    ];

    const currentIndex = steps.indexOf(currentStep as (typeof steps)[number]);
    return currentIndex > 0 ? steps[currentIndex - 1] : null;
  },

  /**
   * Get the previous step in doctor onboarding flow
   */
  getPreviousDoctorOnboardingStep: (currentStep: string): string | null => {
    const steps = [
      ROUTES.ONBOARDING.DOCTOR.NAMES,
      ROUTES.ONBOARDING.DOCTOR.BIRTHDAY,
      ROUTES.ONBOARDING.DOCTOR.GENDER,
      ROUTES.ONBOARDING.DOCTOR.PROFESSIONAL,
      ROUTES.ONBOARDING.DOCTOR.PRACTICE_ADDRESS,
      ROUTES.ONBOARDING.DOCTOR.FILES,
      ROUTES.ONBOARDING.DOCTOR.LICENSE,
      ROUTES.ONBOARDING.DOCTOR.PAYMENT,
      ROUTES.ONBOARDING.DOCTOR.COMPLETE,
    ];

    const currentIndex = steps.indexOf(currentStep as (typeof steps)[number]);
    return currentIndex > 0 ? steps[currentIndex - 1] : null;
  },

  /**
   * Get the next step in patient onboarding flow
   * Note: This function is deprecated. Use the centralized config instead.
   */
  getNextPatientOnboardingStep: (currentStep: string): string | null => {
    const steps = [
      ROUTES.ONBOARDING.PATIENT.PERSONAL,
      ROUTES.ONBOARDING.PATIENT.DATE_OF_BIRTH,
      ROUTES.ONBOARDING.PATIENT.EMAIL,
      ROUTES.ONBOARDING.PATIENT.PHONE,
      ROUTES.ONBOARDING.PATIENT.GENDER,
      ROUTES.ONBOARDING.PATIENT.ADDRESS,
      ROUTES.ONBOARDING.PATIENT.HEALTH_CARD,
      ROUTES.ONBOARDING.PATIENT.HEALTH_CONCERN,
      ROUTES.ONBOARDING.PATIENT.EMERGENCY_CONTACT,
      ROUTES.ONBOARDING.PATIENT.VISIT_TYPE,
      ROUTES.ONBOARDING.PATIENT.APPOINTMENT,
      ROUTES.ONBOARDING.PATIENT.REVIEW,
    ];

    const currentIndex = steps.indexOf(currentStep as (typeof steps)[number]);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;
  },

  /**
   * Get the previous step in patient onboarding flow
   * Note: This function is deprecated. Use the centralized config instead.
   */
  getPreviousPatientOnboardingStep: (currentStep: string): string | null => {
    const steps = [
      ROUTES.ONBOARDING.PATIENT.PERSONAL,
      ROUTES.ONBOARDING.PATIENT.DATE_OF_BIRTH,
      ROUTES.ONBOARDING.PATIENT.EMAIL,
      ROUTES.ONBOARDING.PATIENT.PHONE,
      ROUTES.ONBOARDING.PATIENT.GENDER,
      ROUTES.ONBOARDING.PATIENT.ADDRESS,
      ROUTES.ONBOARDING.PATIENT.HEALTH_CARD,
      ROUTES.ONBOARDING.PATIENT.HEALTH_CONCERN,
      ROUTES.ONBOARDING.PATIENT.EMERGENCY_CONTACT,
      ROUTES.ONBOARDING.PATIENT.VISIT_TYPE,
      ROUTES.ONBOARDING.PATIENT.APPOINTMENT,
      ROUTES.ONBOARDING.PATIENT.REVIEW,
    ];

    const currentIndex = steps.indexOf(currentStep as (typeof steps)[number]);
    return currentIndex > 0 ? steps[currentIndex - 1] : null;
  },
};

// Type definitions for better TypeScript support
export type RouteKey = keyof typeof ROUTES;
export type AuthRouteKey = keyof typeof ROUTES.AUTH;
export type DashboardRouteKey = keyof typeof ROUTES.DASHBOARD;
export type ClinicOnboardingRouteKey = keyof typeof ROUTES.ONBOARDING.CLINIC;
export type DoctorOnboardingRouteKey = keyof typeof ROUTES.ONBOARDING.DOCTOR;
export type PatientOnboardingRouteKey = keyof typeof ROUTES.ONBOARDING.PATIENT;

// Export individual route constants for convenience
export const {
  HOME,
  CONTACT_US,
  HOW_IT_WORKS,
  FOR_PROVIDER,
  PROVIDERS,
  PRIVACY,
  TERMS,
  COOKIES,
} = ROUTES;

export const {
  LOGIN,
  LOGIN_CLINIC,
  LOGIN_DOCTOR,
  REGISTER,
  REGISTER_CLINIC,
  REGISTER_DOCTOR,
  FORGOT_PASSWORD,
  RESET_PASSWORD,
  WELCOME,
} = ROUTES.AUTH;

export const {
  MAIN: DASHBOARD_MAIN,
  CLINIC: DASHBOARD_CLINIC,
  DOCTOR: DASHBOARD_DOCTOR,
  PATIENT: DASHBOARD_PATIENT,
} = ROUTES.DASHBOARD;
