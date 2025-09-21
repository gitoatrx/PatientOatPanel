"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PreVisitWizard } from "@/components/onboarding/patient/confirmation/PreVisitWizard";
import { mockAssessmentData } from "@/data/mockAssessmentData";
import { patientService } from "@/lib/services/patientService";
import { API_CONFIG } from "@/lib/config/api";
import { FollowupQuestion } from "@/lib/types/api";
import { getFormattedPhoneFromStorage } from "@/lib/constants/country-codes";

function HealthCheckInContent() {
  const router = useRouter();
  const [followupQuestions, setFollowupQuestions] = useState<FollowupQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [appointmentId, setAppointmentId] = useState<number | undefined>(undefined);
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchFollowupQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get phone number from localStorage
        const phoneNumber = getFormattedPhoneFromStorage();
        if (!phoneNumber) {
          throw new Error('No phone number found');
        }

        console.log('Health Check-in: Getting onboarding progress for phone:', phoneNumber);

        // Get onboarding progress to retrieve appointment data
        const progressResponse = await patientService.getOnboardingProgress(phoneNumber);

        if (!progressResponse.success || !progressResponse.data) {
          throw new Error('Failed to get onboarding progress');
        }

        const progressData = progressResponse.data;
        console.log('Health Check-in: Progress data received:', progressData);

        // Check if we have confirmation data with appointment_id
        if (!progressData.state.confirmation?.appointment_id) {
          throw new Error('No appointment confirmation found. Please complete your appointment booking first.');
        }

        const appointmentId = progressData.state.confirmation.appointment_id;
        setAppointmentData(progressData);
        setAppointmentId(appointmentId);

        console.log('Health Check-in: Fetching follow-up questions for appointment:', appointmentId);

        // First get the token
        const tokenResponse = await patientService.getFollowupsToken(
          API_CONFIG.CLINIC_ID,
          appointmentId
        );

        console.log('Health Check-in: Token response received:', tokenResponse);

        // Handle direct token response format: {"token":"..."}
        let token: string;
        if (tokenResponse && typeof tokenResponse === 'object' && 'token' in tokenResponse) {
          token = tokenResponse.token as string;
        } else if (tokenResponse && tokenResponse.success && tokenResponse.data?.token) {
          token = tokenResponse.data.token;
        } else {
          console.error('Health Check-in: Failed to get follow-ups token:', tokenResponse);
          throw new Error('Failed to get follow-up token: Invalid response format');
        }

        if (!token) {
          console.error('Health Check-in: No token found in response:', tokenResponse);
          throw new Error('Failed to get follow-up token: No token in response');
        }
        console.log('Health Check-in: Token received:', token);
        setToken(token);

        // Then get the questions using the token
        const questionsResponse = await patientService.getFollowupQuestions(
          API_CONFIG.CLINIC_ID,
          appointmentId,
          token
        );

        console.log('Health Check-in: Questions response received:', questionsResponse);

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

        console.log('Health Check-in: Questions received:', questions);
        setFollowupQuestions(questions);

      } catch (err) {
        console.error('Health Check-in: Error fetching questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
        // Fallback to mock data if API fails
        setFollowupQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowupQuestions();
  }, []);

  const handleClose = () => {
    // Navigate back to confirmation page
    router.push('/onboarding/patient/confirmation');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your personalized questions...</p>
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
  const appt = appointmentData ? {
    doctor: {
      name: appointmentData.state.provider
        ? `${appointmentData.state.provider.first_name} ${appointmentData.state.provider.last_name}`
        : 'Dr. Smith'
    },
    date: appointmentData.state.appointment?.date || '2024-01-15',
    time: appointmentData.state.appointment?.time || '10:00 AM'
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
