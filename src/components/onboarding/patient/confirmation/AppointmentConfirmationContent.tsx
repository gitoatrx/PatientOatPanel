"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  Share2,
  CalendarPlus,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { AiAssessmentChat } from "./AiAssessmentChat";
import { Button } from "@/components/ui/button";
import { patientService } from "@/lib/services/patientService";


export function AppointmentConfirmationContent() {
  const [showAssessment, setShowAssessment] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

        console.log('Fetching confirmation data for phone:', savedPhone);
        const progressResponse = await patientService.getOnboardingProgress(savedPhone);
        
        if (progressResponse.success && progressResponse.data) {
          const apiData = progressResponse.data;
          console.log('Confirmation API response:', apiData);
          
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
            console.log('Set confirmation data:', confirmation);
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

  const handleStartAssessment = () => {
    // Navigate to the health check-in route
    router.push('/onboarding/patient/health-checkin');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    );
  }

  // Show confirmation content
  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    );
  }

  const appt = confirmationData;


  return (
    <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-lg mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h1>
                <p className="text-lg text-gray-600">Your appointment has been successfully booked</p>
              </div>

              <div className="space-y-8">
                {/* Simple Confirmation Message */}
                <div className="text-center">
                  <p className="text-xl text-gray-700 leading-relaxed">
                    Your follow-up appointment with <span className="text-green-600 font-semibold">{appt.doctor.name}</span> has been scheduled for
                    <br />
                    <span className="text-green-600 font-semibold underline">{formatDate(appt.date)}, {formatTime(appt.time)}</span>
                  </p>
                  
                  {/* Appointment Details */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Appointment ID:</strong> {appt.appointment_id}</div>
                      <div><strong>Patient ID:</strong> {appt.guest_patient_id}</div>
                    </div>
                  </div>
                </div>

                {/* Assessment CTA Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="text-center space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Pre-Visit Health Check-in</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Help {appt.doctor.name} prepare for your visit by sharing a quick update about how you've been feeling.
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                    >
                      Start Health Check-in
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="default" className="flex-1 h-12 text-base font-medium">
                    <CalendarPlus className="w-5 h-5 mr-2" /> Add to Calendar
                  </Button>
                  <Button variant="outline" className="flex-1 h-12 text-base font-medium">
                    <Share2 className="w-5 h-5 mr-2" /> Share Appointment
                  </Button>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}