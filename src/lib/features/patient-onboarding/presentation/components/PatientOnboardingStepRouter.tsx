"use client";

import React from "react";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
// import { PatientOnboardingStepId } from "../../domain/patient-onboarding-types";
import {
  PATIENT_ONBOARDING_STEPS,
  shouldSkipStep,
  getNextAccessibleStep,
} from "../../config/patient-onboarding-config";
import { PatientPhoneStep } from "./PatientPhoneStep";
import { PatientOtpVerificationStep } from "./PatientOtpVerificationStep";
import { PatientHealthCardStep } from "./PatientHealthCardStep";
import { PatientPersonalStep } from "./PatientPersonalStep";
import { PatientGenderStep } from "./PatientGenderStep";
import { PatientDateOfBirthStep } from "./PatientDateOfBirthStep";
import { PatientEmailStep } from "./PatientEmailStep";
import { PatientAddressStep } from "./PatientAddressStep";
import { PatientHealthConcernStep } from "./PatientHealthConcernStep";
import { PatientVisitTypeStep } from "./PatientVisitTypeStep";
import { PatientEmergencyContactStep } from "./PatientEmergencyContactStep";
import { PatientDoctorSelectionStep } from "./PatientDoctorSelectionStep";
import { PatientAppointmentDateTimeStep } from "./PatientAppointmentDateTimeStep";
import { PatientReviewStep } from "./PatientReviewStep";

// Create step components mapping using centralized config
const STEP_COMPONENTS: Record<string, React.ComponentType> = {
  phone: PatientPhoneStep,
  verifyOtp: PatientOtpVerificationStep,
  healthCard: PatientHealthCardStep,
  personal: PatientPersonalStep,
  gender: PatientGenderStep,
  dateOfBirth: PatientDateOfBirthStep,
  email: PatientEmailStep,
  address: PatientAddressStep,
  healthConcern: PatientHealthConcernStep,
  visitType: PatientVisitTypeStep,
  emergencyContact: PatientEmergencyContactStep,
  doctorSelection: PatientDoctorSelectionStep,
  appointmentDateTime: PatientAppointmentDateTimeStep,
  review: PatientReviewStep,
};

export function PatientOnboardingStepRouter() {
  const { state } = usePatientOnboarding();

  if (!state) {
    return <div>Loading...</div>;
  }

  // Find the current step configuration
  const currentStepConfig = PATIENT_ONBOARDING_STEPS.find(
    (step) => step.id === state.currentStep,
  );

  if (!currentStepConfig) {
    return <div>Unknown step: {state.currentStep}</div>;
  }

  // ✅ NEW: Check if current step should be skipped (already completed)
  if (
    state.completedSteps &&
    shouldSkipStep(currentStepConfig.name, state.completedSteps)
  ) {
    // Find the next accessible step
    const nextStep = getNextAccessibleStep(
      state.currentStep,
      state.completedSteps,
    );
    if (nextStep !== state.currentStep) {
      const nextStepConfig = PATIENT_ONBOARDING_STEPS.find(
        (step) => step.id === nextStep,
      );
      if (nextStepConfig) {
        const NextStepComponent = STEP_COMPONENTS[nextStepConfig.name];
        if (NextStepComponent) {
          return <NextStepComponent />;
        }
      }
    }
  }

  // Get the component for the current step
  const CurrentStepComponent = STEP_COMPONENTS[currentStepConfig.name];

  if (!CurrentStepComponent) {
    return <div>Component not found for step: {currentStepConfig.name}</div>;
  }

  return <CurrentStepComponent />;
}
