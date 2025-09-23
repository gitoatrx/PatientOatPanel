"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { AiAssessmentChat } from "./AiAssessmentChat";
import { AddToCalendar } from "./AddToCalendar";
import { ShareAppointment } from "./ShareAppointment";
import { Button } from "@/components/ui/button";
import { patientService } from "@/lib/services/patientService";
import { PatientStepShell } from "@/lib/features/patient-onboarding/presentation/components/PatientStepShell";
import { getStepComponentData } from "@/lib/features/patient-onboarding/config/patient-onboarding-config";


export function AppointmentConfirmationContent() {
  const [showAssessment, setShowAssessment] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    appointment_id: number;
    guest_patient_id: number;
    doctor: { name: string };
    date: string;
    time: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowHealthCheckin, setShouldShowHealthCheckin] = useState(false);
  const router = useRouter();

  // Get step configuration
  const stepData = getStepComponentData("confirmation");

  // Fetch confirmation data from API
  useEffect(() => {
    const fetchConfirmationData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get phone number from localStorage
        const savedPhone = localStorage.getItem('patient-phone-number');

        if (!savedPhone) {
          setError('Phone number not found. Please start the onboarding process again.');
          setIsLoading(false);
          return;
        }

        const progressResponse = await patientService.getOnboardingProgress(savedPhone);

        if (progressResponse.success && progressResponse.data) {
          const apiData = progressResponse.data;
          const followupStatuses = apiData.state?.health_concerns?.followup_status;
          const hasFollowupFlag = Array.isArray(followupStatuses)
            ? followupStatuses.some((status) => status === true || status === "true")
            : followupStatuses === true || followupStatuses === "true";
          setShouldShowHealthCheckin(hasFollowupFlag);

          // Extract confirmation data from the API response
          if (apiData.state?.confirmation && apiData.state?.appointment && apiData.state?.provider) {
            const confirmation = {
              appointment_id: apiData.state.confirmation.appointment_id,
              guest_patient_id: apiData.state.confirmation.guest_patient_id,
              date: apiData.state.appointment.date,
              time: apiData.state.appointment.time,
              doctor: {
                name: `Dr. ${apiData.state.provider.first_name} ${apiData.state.provider.last_name}`,
                specialty: 'Family Medicine' // Default specialty since not in API
              }
            };

            setConfirmationData(confirmation);
          } else {
            setError('Confirmation data not found. Please try again.');
          }
        } else {
          console.error('Confirmation API failed:', progressResponse.message);
          setError(progressResponse.message || 'Failed to fetch confirmation information');
        }
      } catch (error) {
        console.error('Error fetching confirmation data:', error);
        setError('Failed to fetch confirmation information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfirmationData();
  }, []);

  // Only prevent body scroll when chat modal is open (not for wizard)
  useEffect(() => {
    if (showAssessment) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAssessment]);

  // Format date from API response (YYYY-MM-DD)
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Format time from API response (HH:MM)
  const formatTime = (timeString: string) => {
    if (!timeString) return "Not specified";
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const handleStartAssessment = async () => {
    if (!confirmationData) {
      console.error('No confirmation data available');
      return;
    }

    try {
      setIsGeneratingQuestions(true);

      // SECURITY: Navigate to health-checkin without exposing appointment_id in URL
      // The health-checkin page will authenticate the user and get their appointment_id securely
      router.push('/onboarding/patient/health-checkin');
    } catch (error) {
      console.error('Error starting health check-in:', error);
      setIsGeneratingQuestions(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <PatientStepShell
        title="Loading..."
        description="Loading your confirmation..."
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading confirmation...</p>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  // Show error state
  if (error) {
    return (
      <PatientStepShell
        title="Error"
        description="Something went wrong"
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  // Show confirmation content
  if (!confirmationData) {
    return (
      <PatientStepShell
        title="No Data"
        description="Confirmation data not available"
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-gray-500 mb-4">No confirmation data available</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </PatientStepShell>
    );
  }

  const appt = confirmationData;


  return (
    <>
      <PatientStepShell
        title="Appointment Confirmed!"
        progressPercent={stepData.progressPercent}
        currentStep={stepData.currentStep}
        totalSteps={stepData.totalSteps}
        useCard={false}
      >
        <div className="max-w-lg mx-auto pb-8">
          {/* Success Icon */}
          <div className="text-center mb-8 pt-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4 relative overflow-hidden">
              <CheckCircle className="w-8 h-8 text-green-600 relative z-10" />
            </div>
          </div>

          <div className="space-y-6">
            {/* Simple Confirmation Message */}
            <div className="text-center">
              <p className="text-xl text-gray-700 leading-relaxed">
                Your appointment with <span className="text-green-600 font-semibold">{appt.doctor.name}</span> has been scheduled for
                <br />
                <span className="text-green-600 font-semibold underline">{formatDate(appt.date)}, {formatTime(appt.time)}</span>
              </p>
            </div>

            {/* Assessment CTA Card */}
            {shouldShowHealthCheckin ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Pre-Visit Health Check-in</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Help {appt.doctor.name} prepare for your visit by sharing a quick update about how you&apos;ve been feeling.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>2-3 minutes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Secure & Private</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartAssessment}
                    disabled={isGeneratingQuestions}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating Questions...
                      </>
                    ) : (
                      <>
                        Start Health Check-in
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

            ) : null}
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <AddToCalendar appointment={appt} className="flex-1" />
              <ShareAppointment appointment={appt} className="flex-1" />
            </div>
          </div>
        </div>
      </PatientStepShell>

      {/* AI Assessment Chat Modal - Outside PatientStepShell */}
      {showAssessment && (
        <AiAssessmentChat
          onClose={() => setShowAssessment(false)}
          doctorName={appt.doctor.name}
          appointmentDate={formatDate(appt.date)}
          appointmentTime={formatTime(appt.time)}
          followupQuestions={[]}
        />
      )}
    </>
  );
}


