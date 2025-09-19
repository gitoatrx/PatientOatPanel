import {
  PATIENT_ONBOARDING_STEPS,
  PATIENT_STEP_MAPPING,
} from "../config/patient-onboarding-config";
import { patientService } from "@/lib/services/patientService";

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
  // Removed STORAGE_KEY - no longer using localStorage

  static getInstance(): PatientOnboardingManager {
    if (!PatientOnboardingManager.instance) {
      PatientOnboardingManager.instance = new PatientOnboardingManager();
    }
    return PatientOnboardingManager.instance;
  }

  async getOnboardingState(): Promise<PatientOnboardingState> {
    // Disabled localStorage loading - using progress API instead
    console.log("PatientOnboardingManager: localStorage loading disabled - using progress API");

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

    // No localStorage saving - using progress API

    console.log("PatientOnboardingManager: Initialized with default state:", this.state);
    return this.state;
  }

  async loadProgressFromAPI(phone: string): Promise<void> {
    try {
      console.log("PatientOnboardingManager: Loading progress from API for phone:", phone);
      
      const progressResponse = await patientService.getOnboardingProgress(phone);
      
      if (progressResponse.success && progressResponse.data) {
        const apiData = progressResponse.data;
        console.log("PatientOnboardingManager: Received progress data from API:", apiData);
        
        // Update state with API data
        if (!this.state) {
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
        }
        
        // Map API step to frontend step number
        const currentStepNumber = this.getStepNumberFromName(apiData.current_step);
        this.state.currentStep = currentStepNumber;
        
        // Extract and populate form data from API state
        const apiState = apiData.state;
        const formData: Record<string, unknown> = {};
        
        // Contact information
        if (apiState.contact) {
          formData.phone = apiState.contact.phone;
          if (apiState.contact.email) {
            formData.email = apiState.contact.email;
          }
        }
        
        // Health card information
        if (apiState.health_card) {
          if (apiState.health_card.health_card_number) {
            formData.hasHealthCard = "yes";
            formData.healthCardNumber = apiState.health_card.health_card_number;
          } else {
            formData.hasHealthCard = "no";
            formData.healthCardNumber = "";
          }
        }
        
        // Personal information
        if (apiState.personal_info) {
          formData.firstName = apiState.personal_info.first_name;
          formData.lastName = apiState.personal_info.last_name;
          if (apiState.personal_info.gender) {
            formData.gender = apiState.personal_info.gender;
          }
          if (apiState.personal_info.date_of_birth) {
            // Parse date of birth and extract day, month, year
            const dateParts = apiState.personal_info.date_of_birth.split('-');
            if (dateParts.length === 3) {
              formData.birthYear = dateParts[0];
              // Convert month from "07" to "7" to match form expectations
              formData.birthMonth = parseInt(dateParts[1], 10).toString();
              // Convert day from "15" to "15" (remove leading zero if any)
              formData.birthDay = parseInt(dateParts[2], 10).toString();
            }
          }
          if (apiState.personal_info.email) {
            formData.email = apiState.personal_info.email;
          }
        }
        
        // Address information
        if (apiState.address) {
          formData.addressLine1 = apiState.address.address_line1;
          formData.addressLine2 = apiState.address.address_line2;
          formData.city = apiState.address.city;
          formData.stateProvince = apiState.address.state_province;
          formData.postalCode = apiState.address.postal_code;
          formData.country = apiState.address.country;
        }
        
        // Visit type information
        if (apiState.visit_type) {
          formData.visitType = apiState.visit_type.visit_type_id === 2 ? "InPerson" : "Virtual";
        }
        
        // Emergency contact information
        if (apiState.emergency_contact) {
          formData.emergencyContactRelationship = apiState.emergency_contact.relationship;
          formData.emergencyContactName = apiState.emergency_contact.name;
          formData.emergencyContactPhone = apiState.emergency_contact.phone;
        }
        
        // Update draft with API data
        this.state.draft = { ...this.state.draft, ...formData };
        
        // Update verification status
        if (apiData.otp_verified_at) {
          this.state.verificationStatus.isPhoneVerified = true;
        }
        
        // Update completion status
        this.state.isComplete = apiData.status === "completed";
        
        // No localStorage saving - using progress API
        
        console.log("PatientOnboardingManager: Successfully loaded and merged progress data:", this.state);
      }
    } catch (error) {
      console.error("PatientOnboardingManager: Failed to load progress from API:", error);
      throw error;
    }
  }

  // Removed saveToLocalStorage method - no longer using localStorage

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

      // No API calls for step saving - using local storage only
      console.log('Saving step data locally:', data);

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

      // No localStorage saving - using progress API

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
      
      // No localStorage saving - using progress API
      
      throw new Error(errorMessage);
    } finally {
      this.state.isLoading = false;
    }
  }

  // No API calls needed for step saving - using local storage only

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
      
      // No localStorage saving - using progress API
      
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
      
      // No localStorage saving - using progress API
      
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
    // No localStorage clearing needed - not using localStorage anymore
    console.log("PatientOnboardingManager: State cleared");
  }
}
