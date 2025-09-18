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
  [key: string]: any;
}

interface PreVisitWizardProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string;
}

export function PreVisitWizard({ isOpen, onClose, doctorName }: PreVisitWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({});
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);

  const { steps, totalSteps } = healthCheckInWizard;

  const updateStepData = useCallback((stepId: string, data: any) => {
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
      // Import patientService dynamically
      // No API call needed - simulating submission
      
      // Simulate health check-in submission (no API call)
      console.log("Simulating health check-in submission:", assessmentData);
      handleClose();
    } catch (error) {
      console.error("Failed to submit health check-in:", error);
      // You could show an error toast here
      // For now, we'll still close the wizard but log the error
      handleClose();
    }
  }, [assessmentData, handleClose]);

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
    const currentStepData = steps[currentStep];
    
    if (currentStepData.id === "intro") {
      return <IntroStep onNext={nextStep} doctorName={doctorName} />;
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
        initialData={stepData[currentStepData.id] || {}}
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
      {/* Fixed Header - matches PatientStepShell pattern */}
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

      {/* Content Area */}

        <div className="w-full max-w-xl mx-auto pt-4">
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


      {/* Fixed Footer - matches PatientStepShell pattern */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background">
        <div className="max-w-xl mx-auto px-4 py-4">
          <Button
            type="button"
            size="lg"
            className="w-full text-lg text-white cursor-pointer"
            onClick={currentStep === totalSteps - 1 ? handleSubmit : nextStep}
            disabled={currentStep > 0 && !isCurrentStepValid}
          >
            {currentStep === totalSteps - 1 ? (
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
                Let's Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// Step Components
function IntroStep({ onNext, doctorName }: { onNext: () => void; doctorName: string }) {
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
            Share a quick update with {doctorName} about how you've been feeling since your last visit.
          </p>
        </div>
      </motion.div>

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
          <h4 className="font-semibold text-blue-900">What's Next?</h4>
        </div>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your doctor will review your information before your visit</li>
          <li>• You'll receive a confirmation email shortly</li>
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
