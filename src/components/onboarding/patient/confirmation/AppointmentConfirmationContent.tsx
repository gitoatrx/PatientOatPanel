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
import { mockAssessmentData } from "@/data/mockAssessmentData";


export function AppointmentConfirmationContent() {
  const [showAssessment, setShowAssessment] = useState(false);
  const router = useRouter();

  const appt = mockAssessmentData.appointmentData;

  const handleStartAssessment = () => {
    // Navigate to the health check-in route
    router.push('/onboarding/patient/health-checkin');
  };

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
                    <span className="text-green-600 font-semibold underline">{appt.date}, {appt.time}</span>
                  </p>
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