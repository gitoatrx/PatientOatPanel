// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useForm, FormProvider } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { FormInput, FormTextarea, FormRadioGroup, FormPhoneInput } from "./ui";
// import { Combobox } from "./ui/combobox";
// import { BimbleLogoIcon } from "../../public/icons/icons";
// import { useSearchParams } from "next/navigation";
// import { getHealthConditions } from "@/lib/constants/medical-specialties";
// import { Button } from "@/components/ui/button";

// // Types and Interfaces
// interface PatientWizardProps {
//   onComplete: () => void;
//   onCancel?: () => void;
// }

// interface StepConfig {
//   field: keyof WizardForm;
//   component: React.ComponentType<any>;
//   props: Record<string, any>;
//   validation?: (formValues: WizardForm) => Promise<boolean>;
// }

// interface StepData {
//   label: string;
//   placeholder?: string;
//   type?: string;
//   options?: Array<{ value: string; label: string; description?: string }>;
// }

// // Schema Definition
// const wizardSchema = z.object({
//   fullName: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
//   age: z
//     .string()
//     .min(1, "Age is required")
//     .refine((val) => {
//       const age = parseInt(val);
//       return !isNaN(age) && age >= 0 && age <= 120;
//     }, "Please enter a valid age (0-120)"),
//   email: z.string().email("Please enter a valid email address"),
//   phone: z.string().min(10, "Please enter a valid phone number"),
//   hasHealthCard: z.enum(["yes", "no"], {
//     required_error: "Please select an option",
//   }),
//   healthCardNumber: z
//     .string()
//     .optional()
//     .superRefine(() => {
//       // Handled in custom validation
//     }),
//   selectedReason: z.string().min(1, "Please select a reason for your visit"),
//   symptoms: z
//     .string()
//     .min(10, "Please provide more details (at least 10 characters)")
//     .max(500, "Description too long (max 500 characters)"),
//     visitType: z
//     .string({
//       required_error: "Please select your preferred visit type",
//       invalid_type_error: "Please select your preferred visit type",
//     })
//     .min(1, "Please select your preferred visit type"),});

// type WizardForm = z.infer<typeof wizardSchema>;

// // Constants
// const TOTAL_STEPS = 7;
// const healthConditions = getHealthConditions();

// // Step Configuration
// const STEP_CONFIG: Record<number, StepData> = {
//   1: { label: "Full Name", placeholder: "Enter your full name", type: "text" },
//   2: { label: "Age", placeholder: "Your age", type: "number" },
//   3: { label: "Email Address", placeholder: "your.email@example.com", type: "email" },
//   4: { label: "Phone Number", type: "tel" },
//   5: {
//     label: "Do you have a BC Health Card?",
//     options: [
//       { value: "yes", label: "Yes, I have a BC Health Card" },
//       { value: "no", label: "No, I don't have one" }
//     ]
//   },
//   6: { label: "What brings you in today?" },
//   7: {
//     label: "Preferred visit type",
//     options: [
//       {
//         value: "virtual",
//         label: "Virtual Consultation",
//         description: "Video call from the comfort of your home",
//       },
//       {
//         value: "in-person",
//         label: "In-Person Visit",
//         description: "Meet your doctor at a clinic location",
//       },
//       {
//         value: "either",
//         label: "Either Option",
//         description: "Let the doctor decide what's best",
//       },
//     ]
//   }
// };

// // Utility Functions
// const createEnterKeyHandler = (handleNext: () => void) => (e: React.KeyboardEvent) => {
//   if (e.key === "Enter") {
//     e.preventDefault();
//     handleNext();
//   }
// };

// const createHealthCardKeyHandler = (handleNext: () => void) => (e: React.KeyboardEvent) => {
//   const allowedKeys = [
//     "Backspace", "Delete", "Tab", "Escape", "Enter",
//     "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"
//   ];

//   if (allowedKeys.includes(e.key) ||
//       (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key))) {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       handleNext();
//     }
//     return;
//   }

//   if (!/^[0-9]$/.test(e.key)) {
//     e.preventDefault();
//   }
// };

// const createHealthCardInputHandler = (e: React.FormEvent<HTMLInputElement>) => {
//   const target = e.target as HTMLInputElement;
//   target.value = target.value.replace(/[^0-9]/g, "");
// };

// // Helper function to map URL parameter to health condition value
// const mapHealthConcernToValue = (healthConcern: string | null) => {
//   if (!healthConcern) return "";
//   const decoded = decodeURIComponent(healthConcern);
//   const condition = healthConditions.find((opt) => opt.label === decoded);
//   return condition ? condition.value : "";
// };

// // Main Component
// export function PatientWizard({ onComplete, onCancel }: PatientWizardProps) {
//   const searchParams = useSearchParams();
//   const [currentStep, setCurrentStep] = useState(1);

//   // Form Setup
//   const methods = useForm<WizardForm>({
//     resolver: zodResolver(wizardSchema),
//     mode: "onBlur",
//     defaultValues: {
//       fullName: "",
//       age: "",
//       email: "",
//       phone: "",
//       hasHealthCard: undefined,
//       healthCardNumber: "",
//       selectedReason: mapHealthConcernToValue(searchParams.get("healthConcern")),
//       symptoms: searchParams.get("healthConcern") ? "" : "",
//       visitType: "",
//     },
//   });

//   const {
//     handleSubmit,
//     formState: { errors },
//     trigger,
//     watch,
//     setValue,
//     setError,
//     clearErrors,
//   } = methods;

//   const formValues = watch();

//   // Helper Functions
//   const getPersonalizedLabel = (stepNumber: number) => {
//     const userName = formValues.fullName?.trim();
//     if (!userName || stepNumber === 1) {
//       return STEP_CONFIG[stepNumber]?.label || "";
//     }

//     const personalizedLabels: Record<number, string> = {
//       2: `How old are you, ${userName}?`,
//       3: `What's your email address, ${userName}?`,
//       4: `What's your phone number, ${userName}?`,
//       5: `Do you have a BC Health Card, ${userName}?`,
//       6: `What brings you in today, ${userName}?`,
//       7: `What's your preferred visit type, ${userName}?`,
//     };

//     return personalizedLabels[stepNumber] || STEP_CONFIG[stepNumber]?.label || "";
//   };

//   // Validation Functions
//   const validateHealthCardStep = async () => {
//     if (!formValues.hasHealthCard) {
//       setError("hasHealthCard", {
//         type: "manual",
//         message: "Please select an option",
//       });
//       return false;
//     }

//     clearErrors("hasHealthCard");

//     if (formValues.hasHealthCard === "yes") {
//       const healthCardNumber = formValues.healthCardNumber;
//       if (!healthCardNumber?.trim()) {
//         setError("healthCardNumber", {
//           type: "manual",
//           message: "Please enter health card number",
//         });
//         return false;
//       }

//       if (!/^\d{10}$/.test(healthCardNumber)) {
//         setError("healthCardNumber", {
//           type: "manual",
//           message: "Health card number must be exactly 10 digits",
//         });
//         return false;
//       }

//       clearErrors("healthCardNumber");
//     }

//     return true;
//   };

//   const validateReasonAndSymptomsStep = async () => {
//     const reasonValid = await trigger("selectedReason");
//     const symptomsValid = await trigger("symptoms");
//     return reasonValid && symptomsValid;
//   };

//   // Navigation Functions
//   const handleNext = useCallback(async () => {
//     const stepValidations: Record<number, () => Promise<boolean>> = {
//       5: validateHealthCardStep,
//       6: validateReasonAndSymptomsStep,
//     };

//     const customValidation = stepValidations[currentStep];
//     if (customValidation) {
//       const isValid = await customValidation();
//       if (isValid) {
//         setCurrentStep((prev) => prev + 1);
//       }
//       return;
//     }

//     const fieldMap: Record<number, keyof WizardForm> = {
//       1: "fullName",
//       2: "age",
//       3: "email",
//       4: "phone",
//       7: "visitType",
//     };

//     const currentField = fieldMap[currentStep];
//     if (currentField) {
//       const isValid = await trigger(currentField);
//       if (isValid) {
//         setCurrentStep((prev) => prev + 1);
//       }
//     }
//   }, [currentStep, formValues, trigger, setError, clearErrors]);

//   const handleBack = () => {
//     setCurrentStep((prev) => Math.max(1, prev - 1));
//   };

//   const handleKeyDown = useCallback(
//     async (e: KeyboardEvent) => {
//       if (e.key === "Enter" && !e.shiftKey) {
//         e.preventDefault();
//         await handleNext();
//       }
//     },
//     [handleNext],
//   );

//   // Effects
//   useEffect(() => {
//     document.addEventListener("keydown", handleKeyDown);
//     return () => document.removeEventListener("keydown", handleKeyDown);
//   }, [handleKeyDown]);

//   // Render Functions
//   const renderStepContent = () => {
//     const stepConfig = STEP_CONFIG[currentStep];
//     const enterKeyHandler = createEnterKeyHandler(handleNext);

//     switch (currentStep) {
//       case 1:
//         return (
//           <FormInput
//             name="fullName"
//             type="text"
//             label={getPersonalizedLabel(currentStep)}
//             placeholder="Enter your full name"
//             onKeyDown={enterKeyHandler}
//           />
//         );

//       case 2:
//         return (
//           <FormInput
//             name="age"
//             type="number"
//             label={getPersonalizedLabel(currentStep)}
//             placeholder="Your age"
//             onKeyDown={enterKeyHandler}
//           />
//         );

//       case 3:
//         return (
//           <FormInput
//             name="email"
//             type="email"
//             label={getPersonalizedLabel(currentStep)}
//             placeholder="your.email@example.com"
//             onKeyDown={enterKeyHandler}
//           />
//         );

//       case 4:
//         return (
//           <FormPhoneInput
//             name="phone"
//             type="tel"
//             label={getPersonalizedLabel(currentStep)}
//             onKeyDown={enterKeyHandler}
//           />
//         );

//       case 5:
//         return (
//           <FormRadioGroup
//             name="hasHealthCard"
//             type="radio"
//             label={getPersonalizedLabel(currentStep)}
//             options={stepConfig.options || []}
//             onKeyDown={enterKeyHandler}
//           />
//         );

//       case 6:
//         return (
//           <div className="space-y-4">
//             <div>
//               <label className="block text-lg font-semibold text-foreground mb-2">
//                 {getPersonalizedLabel(currentStep)}
//               </label>
//               <Combobox
//                 options={healthConditions}
//                 value={formValues.selectedReason}
//                 onValueChange={(value) => setValue("selectedReason", value)}
//                 placeholder="Select your health concern..."
//                 emptyMessage="No health conditions found."
//                 displayValue={(value) => {
//                   const option = healthConditions.find((opt) => opt.value === value);
//                   return option ? option.label : value;
//                 }}
//                 onKeyDown={enterKeyHandler}
//               />
//               {errors.selectedReason && (
//                 <p className="text-sm text-red-600 mt-1">
//                   {errors.selectedReason.message}
//                 </p>
//               )}
//             </div>
//             <FormTextarea
//               name="symptoms"
//               label="Please describe your symptoms in detail"
//               placeholder="Please describe your symptoms, how long you've had them, and any other relevant details..."
//               rows={6}
//               onKeyDown={(e: React.KeyboardEvent) => {
//                 if (e.key === "Enter" && e.ctrlKey) {
//                   e.preventDefault();
//                   handleNext();
//                 }
//               }}
//             />

//           </div>
//         );

//       case 7:
//         return (
//           <div>
//             <FormRadioGroup
//               name="visitType"
//               type="radio"
//               label={getPersonalizedLabel(currentStep)}
//               options={stepConfig.options || []}
//               onKeyDown={enterKeyHandler}
//             />
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   const renderHealthCardInput = () => {
//     if (currentStep === 5 && formValues.hasHealthCard === "yes") {
//       return (
//         <div className="mt-6">
//           <FormInput
//             name="healthCardNumber"
//             label="Health Card Number"
//             placeholder="Enter your 10-digit health card number"
//             type="text"
//             maxLength={10}
//             onKeyDown={createHealthCardKeyHandler(handleNext)}
//             onInput={createHealthCardInputHandler}
//           />
//         </div>
//       );
//     }
//     return null;
//   };

//   const renderAdditionalInfo = () => {
//     if (currentStep === 6) {
//       return (
//         <p className="text-sm text-muted-foreground">
//           Be as detailed as possible to help doctors understand your situation.
//         </p>
//       );
//     }
//     return null;
//   };

//   // Main Render
//   const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

//   return (
//     <FormProvider {...methods}>
//       <div className="fixed inset-0 bg-background z-50 overflow-hidden">
//         {/* Header */}
//         <div className="relative bg-background border-border">
//           <div className="w-full h-2 bg-muted">
//             <motion.div
//               className="h-full bg-primary"
//               initial={{ width: 0 }}
//               animate={{ width: `${progressPercentage}%` }}
//               transition={{ duration: 0.3 }}
//             />
//           </div>

//           <div className="px-4 py-3">
//             <div className="flex items-center justify-between max-w-5xl mx-auto">
//               <Button
//                 onClick={currentStep > 1 ? handleBack : onCancel}
//                 className="flex items-center px-2 py-2 text-foreground rounded-lg transition-colors border border-border bg-muted hover:bg-muted/80 cursor-pointer"
//               >
//                 <ChevronLeft className="w-3 h-3 mr-1" />
//                 {currentStep > 1 ? "Back" : "Cancel"}
//               </Button>

//               <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
//                 <BimbleLogoIcon width={32} height={32} />
//               </div>

//               <div className="invisible flex items-center px-6 py-2 mr-4">
//                 <ChevronLeft className="w-4 h-4 mr-2" />
//                 Back
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Form Content */}
//         <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center justify-start scrollbar-hide">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={currentStep}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               transition={{ duration: 0.3 }}
//               className="w-full max-w-md"
//             >
//               <div className="space-y-6">
//                 <div>{renderStepContent()}</div>
//                 {renderHealthCardInput()}
//                 {renderAdditionalInfo()}
//               </div>
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* Navigation */}
//         <div className="fixed bottom-0 left-0 right-0 z-50 bg-background mb-3 border-border px-4 py-4 flex justify-center items-center">
//           {currentStep === TOTAL_STEPS ? (
//             <Button
//               onClick={handleSubmit(onComplete)}
//               className="w-xs sm:w-sm py-8 sm:py-8 text-md cursor-pointer"
//               size="lg"
//             >
//               Book My Appointment
//               <ChevronRight className="w-4 h-4" />
//             </Button>
//           ) : (
//             <Button
//               onClick={handleNext}
//               className="w-xs sm:w-sm py-8 sm:py-6 text-lg sm:text-md cursor-pointer"
//               size="lg"
//             >
//               Continue
//               <ChevronRight className="w-4 h-4" />
//             </Button>
//           )}
//         </div>
//       </div>
//     </FormProvider>
//   );
// }
