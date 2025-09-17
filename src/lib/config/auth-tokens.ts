/**
 * Authentication Token Configuration
 * Defines token names and validation logic for different user types
 */

// Token names for different user types and states
export const TOKEN_NAMES = {
  doctor: {
    onboarding: "bimble_doctor_onboarding_access_token",
    regular: "bimble_doctor_access_token",
    refresh: "bimble_doctor_refresh_token",
  },
  patient: {
    onboarding: "bimble_patient_onboarding_access_token",
    regular: "bimble_patient_access_token",
    refresh: "bimble_patient_refresh_token",
  },
  clinic: {
    onboarding: "bimble_clinic_onboarding_access_token",
    regular: "bimble_clinic_access_token",
    refresh: "bimble_clinic_refresh_token",
  },
} as const;

// User type detection from routes
export const USER_TYPE_FROM_ROUTE = {
  doctor: ["/onboarding/doctor", "/doctor/"],
  patient: ["/onboarding/patient", "/patient/"],
  clinic: ["/onboarding/clinic", "/clinic/"],
} as const;

// Token validation functions
export const getTokenNamesForUserType = (
  userType: keyof typeof TOKEN_NAMES,
) => {
  return TOKEN_NAMES[userType];
};

export const getUserTypeFromRoute = (
  pathname: string,
): keyof typeof TOKEN_NAMES | null => {
  for (const [userType, routePrefixes] of Object.entries(
    USER_TYPE_FROM_ROUTE,
  )) {
    if (routePrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return userType as keyof typeof TOKEN_NAMES;
    }
  }
  return null;
};

// Token existence check
export const hasValidTokens = (
  request: Request,
  userType: keyof typeof TOKEN_NAMES,
): boolean => {
  const tokenNames = getTokenNamesForUserType(userType);

  // Check cookies
  const hasOnboardingToken = request.headers
    .get("cookie")
    ?.includes(tokenNames.onboarding);

  const hasRegularToken = request.headers
    .get("cookie")
    ?.includes(tokenNames.regular);

  // Check authorization header
  const authHeader = request.headers.get("authorization");
  const hasAuthOnboardingToken = authHeader?.includes(tokenNames.onboarding);
  const hasAuthRegularToken = authHeader?.includes(tokenNames.regular);

  return !!(
    hasOnboardingToken ||
    hasRegularToken ||
    hasAuthOnboardingToken ||
    hasAuthRegularToken
  );
};
