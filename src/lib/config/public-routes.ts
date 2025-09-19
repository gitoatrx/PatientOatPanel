/**
 * Public Routes Configuration
 * Routes that don't require authentication
 */

// Authentication Routes (Public)
export const AUTH_ROUTES = [
  "/login/doctor",
  "/login/patient",
  "/login/clinic",
  "/register/doctor",
  "/register/patient",
  "/register/clinic",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

// Public Pages
export const PUBLIC_PAGES = [
  "/",
  "/home",
  "/about",
  "/contact-us",
  "/privacy",
  "/terms",
  "/how-it-works",
  "/for-provider",
  "/providers",
  "/pricing",
  "/faq",
];

// API Routes (handled separately)
export const API_ROUTES = ["/api"];

// Static Assets (handled separately)
export const STATIC_ROUTES = [
  "/_next",
  "/favicon.ico",
  "/public",
  "/images",
  "/icons",
];

// Combined public routes
export const ALL_PUBLIC_ROUTES = [
  ...AUTH_ROUTES,
  ...PUBLIC_PAGES,
  ...API_ROUTES,
  ...STATIC_ROUTES,
];

// Routes that should redirect authenticated users
export const REDIRECT_AUTHENTICATED_ROUTES = [
  "/login/doctor",
  "/login/patient",
  "/login/clinic",
  "/register/doctor",
  "/register/patient",
  "/register/clinic",
];
