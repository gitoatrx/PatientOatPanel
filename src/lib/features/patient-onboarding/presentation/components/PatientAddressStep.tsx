"use client";

import { FormProvider, useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlacesAddressFields } from "@/components/onboarding/common/PlacesAddressFields";
import { PatientStepShell } from "./PatientStepShell";
import { addressSchema } from "@/lib/utils/patientOnboardingValidation";
import { useRouter } from "next/navigation";
import { usePatientOnboarding } from "../context/PatientOnboardingContext";
import { getStepComponentData } from "../../config/patient-onboarding-config";

export function PatientAddressStep() {
  const router = useRouter();
  const { state, saveStep, isLoading } = usePatientOnboarding();
  
  // Get step configuration
  const stepData = getStepComponentData("address");
  
  const form = useForm({
    resolver: zodResolver(addressSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      streetAddress: (state?.draft?.streetAddress as string) || "",
      city: (state?.draft?.city as string) || "",
      province: (state?.draft?.province as string) || "",
      postalCode: (state?.draft?.postalCode as string) || "",
    },
  });

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      console.log("Address submitted:", values);
      
      // Save to centralized state
      const result = await saveStep(stepData.stepId, {
        streetAddress: values.streetAddress,
        city: values.city,
        province: values.province,
        postalCode: values.postalCode,
      });
      
      // Navigate to health concern step
      router.push("/onboarding/patient/health-concern");
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const handleBack = () => {
    console.log("Back button clicked");
    // Navigate back to email step
    router.push("/onboarding/patient/email");
  };

  // Get real-time form state updates
  const { isValid } = useFormState({
    control: form.control,
  });

  return (
    <PatientStepShell
      title="Where do you live?"
      description="We need your address for your medical records and to find nearby clinics."
      onBack={handleBack}
      onNext={() => form.handleSubmit(handleSubmit)()}
      nextLabel="Continue"
      isSubmitting={isLoading}
      isNextDisabled={!isValid}
      useCard={false}
      progressPercent={Math.round((8 / 15) * 100)}
      currentStep={8}
      totalSteps={15}
    >
      <FormProvider {...form}>
        <div className="max-w-xl mx-auto space-y-6">
          <PlacesAddressFields
            fieldNames={{
              street: "streetAddress",
              city: "city",
              province: "province",
              postalCode: "postalCode",
            }}
            onValidNext={() => form.handleSubmit(handleSubmit)()}
          />
        </div>
      </FormProvider>
    </PatientStepShell>
  );
}
