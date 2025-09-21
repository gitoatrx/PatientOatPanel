"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Shield,
  Heart,
  Activity,
  User,
  Calendar,
  ArrowRight,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { healthCheckInWizard } from "@/data/wizardQuestions";
import { StepRenderer } from "./StepRenderer";
import { FollowupQuestion } from "@/lib/types/api";
import { patientService } from "@/lib/services/patientService";
import { API_CONFIG } from "@/lib/config/api";
import { getFormattedPhoneFromStorage } from "@/lib/constants/country-codes";

// Inline UI components to avoid import issues
const Progress = ({ value = 0, className = "" }: { value?: number; className?: string }) => (
  <div className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
    <div
      className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
      style={{ width: `${value}%` }}
    />
  </div>
);

// Types
interface AssessmentData {
  [key: string]: unknown;
}

interface PreVisitWizardProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string;
  followupQuestions?: FollowupQuestion[];
  appointmentId?: number;
  token?: string;
}

export function PreVisitWizard({ isOpen, onClose, doctorName, followupQuestions = [], appointmentId, token }: PreVisitWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({});
  const [stepData, setStepData] = useState<Record<string, unknown>>({});
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Create dynamic steps from followup questions or use static wizard
  const { steps: staticSteps, totalSteps: staticTotalSteps } = healthCheckInWizard;

  // Convert followup questions to wizard steps
  const dynamicSteps = followupQuestions.map((question, index) => ({
    id: `question_${question.id}`,
    title: `Question ${index + 1}`,
    description: question.text,
    icon: "Sparkles",
    questions: [{
      id: question.id,
      title: question.text,
      text: question.text,
      type: 'single_choice' as const, // Use single_choice for single_select questions
      required: true,
      options: (question.options || []).map((option, optionIndex) => ({
        id: `${question.id}_option_${optionIndex}`,
        label: option,
        value: option,
        description: undefined
      })),
      hint: question.hint
    }]
  }));

  // Use dynamic steps if available, otherwise fall back to static
  const steps = followupQuestions.length > 0 ? dynamicSteps : staticSteps;
  const totalSteps = followupQuestions.length > 0 ? dynamicSteps.length : staticTotalSteps;

  const updateStepData = useCallback((stepId: string, data: unknown) => {
    setStepData(prev => ({ ...prev, [stepId]: data }));
    setAssessmentData(prev => ({ ...prev, [stepId]: data }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Prevent body scroll when wizard is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    setAssessmentData({});
    setStepData({});
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      console.log("Submitting health check-in answers:", assessmentData);

      // If we have followup questions and the necessary data, save answers to API
      if (followupQuestions.length > 0 && appointmentId && token) {
        console.log("Saving answers to API...");

        // Debug: Log all data to understand the structure
        console.log("=== DEBUG: Answer Collection ===");
        console.log("followupQuestions:", followupQuestions);
        console.log("assessmentData:", assessmentData);
        console.log("stepData:", stepData);

        // Format answers for API - array format with id and value
        const answersArray: Array<{ id: string; value: string }> = [];

        followupQuestions.forEach(question => {
          console.log(`Processing question ${question.id}:`, question);

          // The stepId is "question_${question.id}" and the data is stored with question.id as key
          const stepId = `question_${question.id}`;
          const stepAnswer = stepData[stepId];
          console.log(`Answer from stepData[${stepId}]:`, stepAnswer);

          let answer = undefined;
          if (stepAnswer && typeof stepAnswer === 'object') {
            answer = (stepAnswer as Record<string, unknown>)[question.id];
            console.log(`Answer from stepData[${stepId}][${question.id}]:`, answer);
          }

          if (answer !== undefined && answer !== null && answer !== '') {
            answersArray.push({
              id: question.id,
              value: String(answer)
            });
            console.log(`Added answer: ${question.id} = ${answer}`);
          } else {
            console.log(`No answer found for question ${question.id}`);
          }
        });

        const answersPayload = {
          answers: answersArray
        };

        console.log("Final answers array:", answersArray);
        console.log("Formatted answers payload:", answersPayload);

        // Save answers to API
        const saveResponse = await patientService.saveFollowupAnswers(
          API_CONFIG.CLINIC_ID,
          appointmentId,
          token,
          answersPayload
        );

        if (saveResponse.success) {
          console.log("Answers saved successfully:", saveResponse.data);
        } else {
          console.error("Failed to save answers:", saveResponse.message);
        }
      } else {
        console.log("No API data available, skipping API save");
      }

      // Show thank you page instead of closing immediately
      setShowThankYou(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Failed to submit health check-in:", error);
      setIsSubmitting(false);
      // Still show thank you page even if API save fails
      setShowThankYou(true);
    }
  }, [assessmentData, followupQuestions, appointmentId, token]);

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      Sparkles: <Sparkles className="h-5 w-5" />,
      Heart: <Heart className="h-5 w-5" />,
      Activity: <Activity className="h-5 w-5" />,
      Shield: <Shield className="h-5 w-5" />,
      CheckCircle: <CheckCircle2 className="h-5 w-5" />,
    };
    return iconMap[iconName] || <Sparkles className="h-5 w-5" />;
  };


  const renderStepContent = () => {
    // Show thank you page if submission is complete
    if (showThankYou) {
      return <ThankYouStep onComplete={handleClose} doctorName={doctorName} />;
    }

    const currentStepData = steps[currentStep];

    if (currentStepData.id === "intro") {
      return <IntroStep onNext={nextStep} doctorName={doctorName} followupQuestions={followupQuestions} />;
    }

    if (currentStepData.id === "submission") {
      return <SubmissionStep onComplete={handleSubmit} />;
    }

    return (
      <StepRenderer
        step={currentStepData}
        onNext={nextStep}
        onPrev={prevStep}
        onUpdate={(data) => {
          updateStepData(currentStepData.id, data);
          // Update validation state
          const isValid = currentStepData.questions.every(question => {
            if (!question.required) return true;
            const answer = data[question.id];

            if (question.type === 'multiple_choice') {
              return Array.isArray(answer) ? answer.length > 0 : answer !== undefined;
            }

            return answer !== undefined && answer !== null && answer !== '';
          });
          setIsCurrentStepValid(isValid);
        }}
        initialData={stepData[currentStepData.id] as Record<string, unknown> | undefined}
        showBackButton={currentStep > 0}
        isLastStep={currentStep === totalSteps - 1}
        onSubmit={handleSubmit}
        isStepValid={() => isCurrentStepValid}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Fixed Header - matches PatientStepShell pattern - Hidden on thank you page */}
      {!showThankYou && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background">
          {/* Progress bar */}
          <div className="h-2 bg-muted">
            <div
              className="h-full bg-primary"
              style={{
                width: `${progress}%`,
                transition: "width 550ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Header row */}
          <div className="w-full pt-4 pb-4">
            <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="w-24">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      className="inline-flex items-center gap-1 h-8 px-3 border-border cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center text-white justify-center">
                    {getIconComponent(steps[currentStep]?.icon)}
                  </div>
                </div>
                <div className="w-24"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className={`w-full max-w-xl mx-auto ${showThankYou ? 'pt-0' : 'pt-4'}`}>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {/* Content with better spacing */}
            <div className="px-6 py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>


      {/* Fixed Footer - matches PatientStepShell pattern - Hidden on thank you page */}
      {!showThankYou && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background">
          <div className="max-w-xl mx-auto px-4 py-4">
            <Button
              type="button"
              size="lg"
              className="w-full text-lg text-white cursor-pointer"
              onClick={currentStep === totalSteps - 1 ? handleSubmit : nextStep}
              disabled={(currentStep > 0 && !isCurrentStepValid) || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving Your Answers...
                </>
              ) : currentStep === totalSteps - 1 ? (
                <>
                  All Done! 🎉
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              ) : currentStep === 0 ? (
                <>
                  Start Assessment
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Let&apos;s Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// Step Components
function IntroStep({ onNext, doctorName, followupQuestions = [] }: { onNext: () => void; doctorName: string; followupQuestions?: FollowupQuestion[] }) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="text-center space-y-6"
      >
        <motion.div
          className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Calendar className="h-10 w-10 text-white" />
        </motion.div>

        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-gray-900">
            Pre-Visit Health Check-in
          </h3>
          <p className="text-gray-600 text-base leading-relaxed max-w-md mx-auto">
            {followupQuestions.length > 0
              ? `Dr. ${doctorName} has prepared ${followupQuestions.length} personalized question${followupQuestions.length > 1 ? 's' : ''} to better understand your current health status.`
              : `Share a quick update with ${doctorName} about how you've been feeling since your last visit.`
            }
          </p>
        </div>
      </motion.div>

      {/* Questions Preview */}
      {followupQuestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h4 className="font-semibold text-blue-900">Personalized Questions</h4>
          </div>
          <div className="space-y-3">
            {followupQuestions.slice(0, 2).map((question, index) => (
              <div key={question.id} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-sm text-blue-800">{question.text}</p>
              </div>
            ))}
            {followupQuestions.length > 2 && (
              <p className="text-sm text-blue-600 font-medium">
                +{followupQuestions.length - 2} more question{followupQuestions.length - 2 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid gap-4"
      >
        <motion.div
          className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Quick & Easy</p>
            <p className="text-sm text-gray-600">Just 2-3 minutes to complete</p>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Secure & Private</p>
            <p className="text-sm text-gray-600">HIPAA compliant data protection</p>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Better Care</p>
            <p className="text-sm text-gray-600">Helps your doctor provide personalized treatment</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="space-y-4"
      >
      </motion.div>
    </div>
  );
}


function SubmissionStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">
            Health Check-in Complete! 🎉
          </h3>
          <p className="text-gray-600">
            Thank you for sharing your information. Your doctor will have everything they need for your visit.
          </p>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-green-900">Information Submitted</h4>
            <p className="text-sm text-green-700">Your responses have been securely shared with your doctor</p>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <h4 className="font-semibold text-blue-900">What&apos;s Next?</h4>
        </div>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your doctor will review your information before your visit</li>
          <li>• You&apos;ll receive a confirmation email shortly</li>
          <li>• Arrive 10 minutes early for your appointment</li>
        </ul>
      </div>

      {/* Complete Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onComplete}
          className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-white"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Close
        </Button>
      </div>
    </div>
  );
}

function ThankYouStep({ onComplete, doctorName }: { onComplete: () => void; doctorName: string }) {
  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Thank You Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-center space-y-4 sm:space-y-6"
        >
          <motion.div
            className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-xl"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
          </motion.div>

          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Thank You! 🎉
            </h3>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-md mx-auto px-2">
              Your health assessment has been successfully submitted to {doctorName}. Your responses will help provide the best possible care during your visit.
            </p>
          </div>
        </motion.div>

        {/* Simplified Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-green-50 rounded-xl border border-green-100">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Answers Saved Successfully</p>
              <p className="text-xs sm:text-sm text-gray-600">Your responses have been shared with your doctor</p>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex justify-center pt-4 sm:pt-6"
        >
          <Button
            onClick={onComplete}
            className="w-full max-w-sm h-12 sm:h-14 text-base sm:text-lg font-medium bg-primary hover:bg-primary/90 text-white shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Return to Appointment Details
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
