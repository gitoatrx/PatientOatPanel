"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  PatientOnboardingManager,
  type PatientOnboardingState,
} from "../../application/patient-onboarding-manager";
// Removed ROUTES import for UI-only mode

interface PatientOnboardingContextType {
  state: PatientOnboardingState | null;
  isLoading: boolean;
  error: string | null;
  saveStep: (
    step: number,
    data: unknown,
  ) => Promise<{ nextHref: string; currentStep: string }>;
  completeOnboarding: () => Promise<void>;
  registerPatient: (data: unknown) => Promise<boolean>;
  clearError: () => void;
  refreshState: () => Promise<void>;
  loadProgressFromAPI: (phone: string) => Promise<void>;
}

const PatientOnboardingContext =
  createContext<PatientOnboardingContextType | null>(null);

export function PatientOnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<PatientOnboardingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [abortController, setAbortController] = useState<AbortController | null>(null);

  const manager = PatientOnboardingManager.getInstance();

  const refreshState = useCallback(async () => {
    try {
      console.log("PatientOnboardingContext: Starting refreshState...");
      // Don't set loading to true for refreshState to prevent flicker
      setError(null);
      const newState = await manager.getOnboardingState();
      console.log("PatientOnboardingContext: Got new state:", newState);
      setState(newState);
      console.log(
        "PatientOnboardingContext: refreshState completed successfully",
      );
    } catch (err) {
      // In UI-only mode, provide default state instead of showing errors
      console.log("PatientOnboardingContext: Error during refreshState, providing default state for UI-only mode:", err);
      
      const defaultState = {
        currentStep: 1,
        isComplete: false,
        draft: {},
        isLoading: false,
        error: null,
        accountId: null,
        completedSteps: [],
        verificationStatus: {
          isEmailVerified: false,
          isPhoneVerified: false,
        },
      };
      
      setState(defaultState);
      setIsLoading(false);
      setError(null); // Don't show errors in UI-only mode
    }
  }, [manager]);

  const saveStep = useCallback(
    async (step: number, data: unknown) => {
      if (!state) {
        // In UI-only mode, provide default state instead of throwing error
        console.log("PatientOnboardingContext: No state available, providing default state for UI-only mode");
        const defaultState = {
          currentStep: 1,
          isComplete: false,
          draft: {},
          isLoading: false,
          error: null,
          accountId: null,
          completedSteps: [],
          verificationStatus: {
            isEmailVerified: false,
            isPhoneVerified: false,
          },
        };
        setState(defaultState);
      }

      try {
        setError(null);
        const result = await manager.saveStep(step, data);

        // Refresh state after saving to ensure the next step has the updated data
        const newState = await manager.getOnboardingState();
        setState(newState);

        // Return the nextHref and currentStep for navigation
        return result;
      } catch (err) {
        // In UI-only mode, provide default result instead of throwing error
        console.log("PatientOnboardingContext: Error during saveStep, providing default result for UI-only mode:", err);
        
        const defaultResult = {
          nextHref: `/onboarding/patient/step-${step + 1}`,
          currentStep: `step-${step + 1}`,
        };
        
        setError(null); // Don't show errors in UI-only mode
        return defaultResult;
      }
    },
    [manager, state],
  );

  const completeOnboarding = useCallback(async () => {
    if (!state) {
      // In UI-only mode, provide default state instead of throwing error
      console.log("PatientOnboardingContext: No state available for completeOnboarding, providing default state for UI-only mode");
      const defaultState = {
        currentStep: 1,
        isComplete: false,
        draft: {},
        isLoading: false,
        error: null,
        accountId: null,
        completedSteps: [],
        verificationStatus: {
          isEmailVerified: false,
          isPhoneVerified: false,
        },
      };
      setState(defaultState);
    }

    try {
      setError(null);
      await manager.completeOnboarding();

      // Don't refresh state after completion to prevent extra API calls
      // The manager already updates the local state
    } catch (err) {
      // In UI-only mode, just log the error and don't throw
      console.log("PatientOnboardingContext: Error during completeOnboarding, continuing in UI-only mode:", err);
      setError(null); // Don't show errors in UI-only mode
    }
  }, [manager, state]);

  const registerPatient = useCallback(
    async (data: unknown) => {
      try {
        setError(null);
        const success = await manager.registerPatient(data);

        if (success) {
          // Don't refresh state after registration to prevent extra API calls
          // The manager already updates the local state
        }

        return success;
      } catch (err) {
        // In UI-only mode, return true instead of throwing error
        console.log("PatientOnboardingContext: Error during registerPatient, returning success for UI-only mode:", err);
        setError(null); // Don't show errors in UI-only mode
        return true; // Simulate successful registration in UI-only mode
      }
    },
    [manager],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadProgressFromAPI = useCallback(async (phone: string) => {
    try {
      console.log("PatientOnboardingContext: Loading progress from API for phone:", phone);
      setError(null);
      await manager.loadProgressFromAPI(phone);
      
      // Refresh state after loading progress
      const newState = await manager.getOnboardingState();
      setState(newState);
      
      console.log("PatientOnboardingContext: Successfully loaded progress from API");
    } catch (err) {
      console.error("PatientOnboardingContext: Failed to load progress from API:", err);
      setError(err instanceof Error ? err.message : "Failed to load progress");
    }
  }, [manager]);

  // Initialize state on mount
  useEffect(() => {
    const initializeState = async () => {
      try {
        console.log("PatientOnboardingContext: Starting initialization...");
        setError(null);
        const initialState = await manager.getOnboardingState();
        console.log(
          "PatientOnboardingContext: Got initial state:",
          initialState,
        );
        setState(initialState);
        setIsLoading(false); // Set loading to false after successful API call
        console.log(
          "PatientOnboardingContext: Initialization completed successfully",
        );
      } catch (err) {
        // In UI-only mode, always provide a default state to prevent blank UI
        console.log("PatientOnboardingContext: Error during initialization, providing default state for UI-only mode:", err);
        
        const defaultState = {
          currentStep: 1,
          isComplete: false,
          draft: {},
          isLoading: false,
          error: null,
          accountId: null,
          completedSteps: [],
          verificationStatus: {
            isEmailVerified: false,
            isPhoneVerified: false,
          },
        };
        
        setState(defaultState);
        setIsLoading(false);
        setError(null); // Don't show errors in UI-only mode
      }
    };

    initializeState();
  }, [manager]);

  const contextValue: PatientOnboardingContextType = {
    state,
    isLoading,
    error,
    refreshState,
    saveStep,
    completeOnboarding,
    registerPatient,
    clearError,
    loadProgressFromAPI,
  };

  return (
    <PatientOnboardingContext.Provider value={contextValue}>
      {children}
    </PatientOnboardingContext.Provider>
  );
}

export function usePatientOnboarding(): PatientOnboardingContextType {
  const context = useContext(PatientOnboardingContext);
  if (!context) {
    throw new Error(
      "usePatientOnboarding must be used within PatientOnboardingProvider",
    );
  }
  return context;
}
