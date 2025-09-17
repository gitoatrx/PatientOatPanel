import {
  PATIENT_ONBOARDING_STEPS,
  PATIENT_STEP_MAPPING,
} from "../config/patient-onboarding-config";

export interface PatientOnboardingState {
  currentStep: number;
  isComplete: boolean;
  draft: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;
  accountId: string | null;
  completedSteps: string[]; // ✅ NEW: Array of completed step names
  verificationStatus: {
    // ✅ NEW: Email/phone verification status
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
  };
}

export interface PatientOnboardingStep {
  id: number;
  name: string;
  title: string;
  isCompleted: boolean;
  isAccessible: boolean;
}

export class PatientOnboardingManager {
  private static instance: PatientOnboardingManager;
  private state: PatientOnboardingState | null = null;
  private readonly STORAGE_KEY = "patient_onboarding_state";

  static getInstance(): PatientOnboardingManager {
    if (!PatientOnboardingManager.instance) {
      PatientOnboardingManager.instance = new PatientOnboardingManager();
    }
    return PatientOnboardingManager.instance;
  }

  async getOnboardingState(): Promise<PatientOnboardingState> {
    // Try to load from localStorage first
    if (typeof window !== "undefined") {
      try {
        const savedState = localStorage.getItem(this.STORAGE_KEY);
        if (savedState) {
          this.state = JSON.parse(savedState);
          console.log("PatientOnboardingManager: Loaded state from localStorage:", this.state);
          return this.state!;
        }
      } catch (error) {
        console.warn("PatientOnboardingManager: Failed to load state from localStorage:", error);
      }
    }

    // Initialize with default state for UI-only mode
    this.state = {
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

    // Save to localStorage
    this.saveToLocalStorage();

    console.log("PatientOnboardingManager: Initialized with default state:", this.state);
    return this.state;
  }

  private saveToLocalStorage(): void {
    if (typeof window !== "undefined" && this.state) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
        console.log("PatientOnboardingManager: Saved state to localStorage:", this.state);
      } catch (error) {
        console.warn("PatientOnboardingManager: Failed to save state to localStorage:", error);
      }
    }
  }

  async saveStep(
    step: number,
    data: unknown,
  ): Promise<{ nextHref: string; currentStep: string }> {
    if (!this.state) {
      throw new Error("Onboarding state not initialized");
    }

    try {
      this.state.isLoading = true;
      this.state.error = null;

      // Update local state with form data
      this.state.draft = { ...this.state.draft, ...(data as Record<string, unknown>) };
      
      // Move to next step (simple progression)
      const nextStep = step + 1;
      this.state.currentStep = nextStep;
      
      // Mark current step as completed
      const stepName = this.getStepNameFromNumber(step);
      if (stepName && !this.state.completedSteps.includes(stepName)) {
        this.state.completedSteps.push(stepName);
      }

      // Check if onboarding is complete
      this.state.isComplete = nextStep > PATIENT_ONBOARDING_STEPS.length;

      // Save to localStorage
      this.saveToLocalStorage();

      // Return navigation info
      const nextStepName = this.getStepNameFromNumber(nextStep);
      return {
        nextHref: nextStepName ? `/onboarding/patient/${nextStepName}` : '/onboarding/complete',
        currentStep: nextStepName || 'complete',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save step";
      this.state.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.state.isLoading = false;
    }
  }

  async completeOnboarding(): Promise<void> {
    if (!this.state) {
      throw new Error("Onboarding state not initialized");
    }

    try {
      this.state.isLoading = true;
      this.state.error = null;

      // Mark onboarding as complete
      this.state.isComplete = true;
      this.state.currentStep = PATIENT_ONBOARDING_STEPS.length + 1;
      
      // Save to localStorage
      this.saveToLocalStorage();
      
      console.log("PatientOnboardingManager: Onboarding completed successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to complete onboarding";
      this.state.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.state.isLoading = false;
    }
  }

  async registerPatient(data: unknown): Promise<boolean> {
    try {
      this.state = this.state || {
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

      this.state.isLoading = true;
      this.state.error = null;

      // In UI-only mode, just simulate successful registration
      console.log("PatientOnboardingManager: Simulating patient registration with data:", data);
      
      this.state.isComplete = true;
      this.state.draft = { ...this.state.draft, ...(data as Record<string, unknown>) };
      
      // Save to localStorage
      this.saveToLocalStorage();
      
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      this.state = this.state || {
        currentStep: 1,
        isComplete: false,
        draft: {},
        isLoading: false,
        error: errorMessage,
        accountId: null,
        completedSteps: [],
        verificationStatus: {
          isEmailVerified: false,
          isPhoneVerified: false,
        },
      };
      this.state.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      if (this.state) {
        this.state.isLoading = false;
      }
    }
  }

  // Use centralized config for step definitions
  getOnboardingSteps(): PatientOnboardingStep[] {
    return PATIENT_ONBOARDING_STEPS.map((step) => ({
      id: step.id,
      name: step.name,
      title: step.title,
      isCompleted: step.isCompleted,
      isAccessible: step.isAccessible,
    }));
  }

  private getAccountId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("bimble_patient_account_id");
  }

  private getStepNumberFromName(stepName: string): number {
    // Convert API step name to frontend step number
    const stepEntry = Object.entries(PATIENT_STEP_MAPPING).find(
      ([, name]) => name === stepName,
    );
    console.log(
      "PatientOnboardingManager: Converting step name:",
      stepName,
      "->",
      stepEntry ? stepEntry[0] : "not found",
    );
    return stepEntry ? parseInt(stepEntry[0], 10) : 1;
  }

  private getStepNameFromNumber(stepNumber: number): string | null {
    // Convert frontend step number to step name
    const step = PATIENT_ONBOARDING_STEPS.find(s => s.id === stepNumber);
    return step ? step.name : null;
  }

  getState(): PatientOnboardingState | null {
    return this.state;
  }

  clearState(): void {
    this.state = null;
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log("PatientOnboardingManager: Cleared state from localStorage");
      } catch (error) {
        console.warn("PatientOnboardingManager: Failed to clear state from localStorage:", error);
      }
    }
  }
}
