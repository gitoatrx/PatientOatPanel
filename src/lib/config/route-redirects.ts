/**
 * Route Redirect Configuration
 * Defines where users should be redirected based on their authentication state
 */

// Default redirect routes for each user type
export const DEFAULT_REDIRECTS = {
  doctor: {
    onboarding: "/onboarding/doctor/names",
    dashboard: "/doctor/dashboard",
    login: "/login/doctor",
    register: "/register/doctor",
  },
  patient: {
    onboarding: "/onboarding/patient/names",
    dashboard: "/patient/dashboard",
    login: "/login/patient",
    register: "/register/patient",
  },
  clinic: {
    onboarding: "/onboarding/clinic/personal",
    dashboard: "/clinic/dashboard",
    login: "/login/clinic",
    register: "/register/clinic",
  },
} as const;

// Routes that should redirect to specific onboarding steps if user has tokens
export const ONBOARDING_INDEX_ROUTES = {
  "/register/doctor": "/onboarding/doctor/names",
  "/onboarding/doctor": "/onboarding/doctor/names",
  "/register/patient": "/onboarding/patient/names",
  "/onboarding/patient": "/onboarding/patient/names",
  "/register/clinic": "/onboarding/clinic/personal",
  "/onboarding/clinic": "/onboarding/clinic/personal",
} as const;

// Routes that should redirect to dashboard if user is already onboarded
export const DASHBOARD_REDIRECT_ROUTES = {
  "/onboarding/doctor/complete": "/doctor/dashboard",
  "/onboarding/patient/complete": "/patient/dashboard",
  "/onboarding/clinic/complete": "/clinic/dashboard",
} as const;

// Error redirect routes
export const ERROR_REDIRECTS = {
  unauthorized: {
    doctor: "/login/doctor",
    patient: "/login/patient",
    clinic: "/login/clinic",
  },
  notFound: "/",
  serverError: "/",
} as const;
