"use client";

import { Info } from "lucide-react";
import { PatientStepShell } from "@/lib/features/patient-onboarding/presentation/components/PatientStepShell";
import { getStepComponentData } from "@/lib/features/patient-onboarding/config/patient-onboarding-config";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PreVisitWizard } from "@/components/onboarding/patient/confirmation/PreVisitWizard";
import { mockAssessmentData } from "@/data/mockAssessmentData";
import { patientService } from "@/lib/services/patientService";
import { API_CONFIG } from "@/lib/config/api";
import { FollowupQuestion } from "@/lib/types/api";
import { getFormattedPhoneFromStorage } from "@/lib/constants/country-codes";

function HealthCheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [followupQuestions, setFollowupQuestions] = useState<FollowupQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noFollowupMessage, setNoFollowupMessage] = useState<string | null>(null);
  const confirmationStepData = getStepComponentData("confirmation");
  
  interface AppointmentData {
    state?: {
      provider?: {
        first_name: string;
        last_name: string;
      };
      appointment?: {
        date: string;
        time: string;
      };
      confirmation?: {
        appointment_id: number;
      };
    };
  }

  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [appointmentId, setAppointmentId] = useState<number | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate follow-up questions using the two-step API process
  const generateFollowupQuestions = async (appointmentId: number, signal?: AbortSignal) => {
    try {
      setIsGeneratingQuestions(true);
      // Step 1: Get the token
      const tokenResponse = await patientService.getFollowupsToken(
        API_CONFIG.CLINIC_ID,
        appointmentId
      );

      // Check if request was cancelled
      if (signal?.aborted) {
        return;
      }

      // Handle direct token response format: {"token":"..."}
      let token: string;
      if (tokenResponse && typeof tokenResponse === 'object' && 'token' in tokenResponse) {
        token = tokenResponse.token as string;
      } else if (tokenResponse && tokenResponse.success && tokenResponse.data?.token) {
        token = tokenResponse.data.token;
      } else {
        console.error('Health Check-in: Failed to get follow-ups token:', tokenResponse);
        throw new Error('Failed to get follow-ups token: Invalid response format');
      }

      if (!token) {
        throw new Error('Failed to get follow-ups token: No token in response');
      }
      setToken(token);

      // Step 2: Get the questions using the token
      const questionsResponse = await patientService.getFollowupQuestions(
        API_CONFIG.CLINIC_ID,
        appointmentId,
        token
      );

      // Check if request was cancelled
      if (signal?.aborted) {
        return;
      }

      // Handle direct questions response format: {"questions": [...], "answers": []}
      let questions;
      if (questionsResponse && typeof questionsResponse === 'object' && 'questions' in questionsResponse) {
        questions = questionsResponse.questions;
      } else if (questionsResponse && questionsResponse.success && questionsResponse.data?.questions) {
        questions = questionsResponse.data.questions;
      } else {
        console.error('Health Check-in: Failed to get follow-up questions:', questionsResponse);
        throw new Error('Failed to get follow-up questions: Invalid response format');
      }

      if (!questions || !Array.isArray(questions)) {
        console.error('Health Check-in: No questions found in response:', questionsResponse);
        throw new Error('Failed to get follow-up questions: No questions in response');
      }

      setFollowupQuestions(questions);

    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      throw error; // Re-throw to be handled by the caller
    } finally {
      if (!signal?.aborted) {
        setIsGeneratingQuestions(false);
      }
    }
  };

  useEffect(() => {
    // Prevent duplicate initialization
    if (isInitialized) {
      return;
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

    const initializeHealthCheckIn = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setNoFollowupMessage(null);

        // SECURITY: Always require authentication first
        // Get phone number from localStorage (required for authentication)
        const phoneNumber = getFormattedPhoneFromStorage();
        if (!phoneNumber) {
          throw new Error('Authentication required. Please complete the onboarding process first.');
        }

        // Get onboarding progress to verify user authentication and get appointment data
        const progressResponse = await patientService.getOnboardingProgress(phoneNumber);

        if (!progressResponse.success || !progressResponse.data) {
          throw new Error('Authentication failed. Please complete the onboarding process first.');
        }

        const progressData = progressResponse.data;

        // SECURITY: Verify user has completed onboarding and has a valid appointment
        if (!progressData.state.confirmation?.appointment_id) {
          throw new Error('No valid appointment found. Please complete your appointment booking first.');
        }

        const userAppointmentId = progressData.state.confirmation.appointment_id;

        // SECURITY: Check URL parameter for appointment_id (if provided)
        const urlAppointmentId = searchParams.get('appointment_id');
        if (urlAppointmentId) {
          const requestedAppointmentId = parseInt(urlAppointmentId, 10);
          
          // SECURITY: Verify the requested appointment_id belongs to the authenticated user
          if (requestedAppointmentId !== userAppointmentId) {
            logSecurityEvent('Unauthorized appointment access attempt', {
              requestedAppointmentId,
              userAppointmentId,
              phoneNumber: phoneNumber?.replace(/\d(?=\d{4})/g, '*'), // Mask phone number for privacy
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent
            });
            throw new Error('Access denied. You can only access your own appointment health check-in.');
          }
        }

        // Check if component was unmounted or cancelled
        if (signal.aborted) {
          return;
        }

        // Set the verified appointment data
        setAppointmentId(userAppointmentId);
        setAppointmentData(progressData);

        const healthConcerns = progressData.state?.health_concerns;
        let hasFollowupFlag = true;
        if (healthConcerns) {
          const followupStatuses = healthConcerns.followup_status;
          if (Array.isArray(followupStatuses)) {
            hasFollowupFlag = followupStatuses.some((status) => status === true || status === "true");
          } else if (followupStatuses !== undefined) {
            hasFollowupFlag = followupStatuses === true || followupStatuses === "true";
          }
          if (!hasFollowupFlag) {
            if (!signal.aborted) {
              const labels = Array.isArray(healthConcerns.selected_labels) ? healthConcerns.selected_labels.filter(Boolean) : [];
              const labelText = labels.length > 1
                ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`
                : labels[0] ?? "this concern";
              setFollowupQuestions([]);
              setToken(undefined);
              setNoFollowupMessage(`We don't have a pre-visit follow-up for ${labelText}. Your clinician will review it with you during the appointment.`);
              setIsInitialized(true);
            }
            return;
          }
        }

        // Generate follow-up questions with abort signal
        await generateFollowupQuestions(userAppointmentId, signal);

        // Mark as initialized only after successful completion
        if (!signal.aborted) {
          setIsInitialized(true);
        }

      } catch (err) {
        if (!signal.aborted) {
          console.error('Health Check-in: Error initializing:', err);
          setError(err instanceof Error ? err.message : 'Failed to load health check-in');
          // Fallback to empty questions array
          setFollowupQuestions([]);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    initializeHealthCheckIn();

    // Cleanup function to prevent race conditions
    return () => {
      abortController.abort();
    };
  }, []); // Empty dependency array - only run once on mount

  const handleClose = () => {
    // Navigate back to confirmation page
    router.push('/onboarding/patient/confirmation');
  };

  // Security logging function
  const logSecurityEvent = (event: string, details: Record<string, unknown>) => {
    console.warn(`[SECURITY] ${event}:`, details);
    // In production, this should be sent to a security monitoring service
  };

  if (isLoading || isGeneratingQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isGeneratingQuestions ? 'Generating your personalized questions...' : 'Loading health check-in...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Questions</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Create appointment data from progress response or use mock data
  if (noFollowupMessage) {
    return (
      <PatientStepShell
        title="No Follow-up Check-in Needed"
        description={noFollowupMessage}
        useCard={false}
        currentStep={confirmationStepData.currentStep}
        totalSteps={confirmationStepData.totalSteps}
        progressPercent={confirmationStepData.progressPercent}
        onBack={handleClose}
        onNext={handleClose}
        nextLabel="Back to confirmation"
      >
        <div className="max-w-lg mx-auto py-16">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
              <Info className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              If anything changes before your visit, please call the clinic so we can update your chart.
            </p>
          </div>
        </div>
      </PatientStepShell>
    );
  }
  const appt = appointmentData ? {
    doctor: {
      name: appointmentData.state?.provider
        ? `${appointmentData.state.provider.first_name} ${appointmentData.state.provider.last_name}`
        : 'Dr. Smith'
    },
    date: appointmentData.state?.appointment?.date || '2024-01-15',
    time: appointmentData.state?.appointment?.time || '10:00 AM'
  } : mockAssessmentData.appointmentData;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <PreVisitWizard
          isOpen={true}
          onClose={handleClose}
          doctorName={appt.doctor.name}
          followupQuestions={followupQuestions}
          appointmentId={appointmentId}
          token={token}
        />
      </div>
    </div>
  );
}

export default function HealthCheckInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading health check-in...</p>
        </div>
      </div>
    }>
      <HealthCheckInContent />
    </Suspense>
  );
}
