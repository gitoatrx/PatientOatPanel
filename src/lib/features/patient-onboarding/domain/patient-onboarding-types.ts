// Patient Onboarding Types and Enums

import {
  // PatientOnboardingStepConfig,
  PatientOnboardingStepId,
  // PatientOnboardingStepName,
  // PatientOnboardingApiStepName
} from "../config/patient-onboarding-config";

// Keep the enum for backward compatibility - values must match config step IDs
export enum PatientOnboardingStep {
  Phone = 1, // From config: phone
  VerifyOtp = 2, // From config: verifyOtp
  HealthCard = 3, // From config: healthCard
  PersonalInfo = 4, // From config: personal
  Gender = 5, // From config: gender
  DateOfBirth = 6, // From config: dateOfBirth
  Email = 7, // From config: email
  Address = 8, // From config: address
  EmergencyContact = 9, // From config: emergencyContact
  HealthConcern = 10, // From config: healthConcern
  VisitType = 11, // From config: visitType
  DoctorSelection = 12, // From config: doctorSelection
  AppointmentDateTime = 13, // From config: appointmentDateTime
  Review = 14, // From config: review
  Confirmation = 15, // From config: confirmation
}

// Updated interface using centralized config types
export interface PatientOnboardingState {
  currentStep: PatientOnboardingStepId;
  isComplete: boolean;
  draft: PatientOnboardingFormData;
  isLoading: boolean;
  error: string | null;
  accountId: string | null;
}

export interface PatientOnboardingFormData {
  // Personal Info
  firstName?: string;
  lastName?: string;

  // Date of Birth
  birthDay?: string;
  birthMonth?: string;
  birthYear?: string;

  // Contact Info
  email?: string;
  phone?: string;

  // Demographics
  gender?: string;

  // Address
  streetAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;

  // Health Card
  hasHealthCard?: "yes" | "no";
  healthCardNumber?: string;

  // Health Concern
  selectedReason?: string;
  symptoms?: string;

  // Emergency Contact
  emergencyContactRelationship?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  // Visit Type
  visitType?: string;

  // Appointment
  doctorId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export interface PatientOnboardingStepData {
  step: PatientOnboardingStep;
  data: Partial<PatientOnboardingFormData>;
}

export interface PatientOnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  isComplete: boolean;
}

export interface PatientOnboardingApiResponse {
  success: boolean;
  message: string;
  data?: PatientOnboardingFormData;
  progress?: PatientOnboardingProgress;
}

// Export types from config for use throughout the application
export type {
  PatientOnboardingStepConfig,
  PatientOnboardingStepName,
  PatientOnboardingStepId,
  PatientOnboardingApiStepName,
} from "../config/patient-onboarding-config";
