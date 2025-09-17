"use client";

import { useState, useEffect } from "react";
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


export function AppointmentConfirmationContent() {
  const [showAssessment, setShowAssessment] = useState(false);

  const appt = {
    id: "BK-7D3Q29",
    status: "Confirmed",
    patientName: "Alex Chen",
    date: "Sep 15, 2025",
    time: "2:30 PM",
    endTime: "3:15 PM",
    durationMin: 45,
    timezone: "PST (-8:00)",
    visitType: "In‑person",
    doctor: { name: "Dr. Sarah Johnson", specialty: "General Practitioner", years: 5 },
    clinic: { name: "Downtown Medical Center", room: "Room 205, Floor 2", address: "123 Main St, Vancouver" },
    contact: { phone: "+1 (604) 555‑0123", email: "frontdesk@downtownmed.example", website: "downtownmed.example" },
    policy: { cancelWindow: "24h before", latePolicy: "10‑minute grace period" },
    payment: { insurance: "BlueShield PPO", copayEstimate: "$25" },
    prep: ["Bring a photo ID and insurance card", "Arrive 10 minutes early for check‑in"],
    documents: ["Prior lab results (last 6 months)", "Medication list"]
  };


  const handleStartAssessment = () => {
    setShowAssessment(true);
  };

  // Prevent body scroll when chat is open
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h1>
          <p className="text-lg text-gray-600">Your appointment has been successfully booked</p>
        </div>

        {!showAssessment ? (
          <div className="space-y-8">
            {/* Simple Confirmation Message */}
            <div className="text-center">
              <p className="text-xl text-gray-700 leading-relaxed">
                Your appointment with <span className="text-green-600 font-semibold">{appt.doctor.name}</span> has been scheduled for
                <br />
                <span className="text-green-600 font-semibold underline">{appt.date}, {appt.time}</span>
              </p>
            </div>

            {/* Assessment CTA Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Help Your Doctor Help You</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Your doctor wants to give you the best care possible. Sharing a few details now helps them understand your needs better and saves time during your visit.
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
                  Help My Doctor Prepare
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
        ) : (
          /* AI Assessment Chat */
          <div className="fixed inset-0 bg-gray-50 z-50 overflow-hidden">
            <div className="h-full flex items-center justify-center">
              <div className="bg-white shadow-lg border border-gray-200 h-full max-w-xl w-full rounded-t-xl">
                <AiAssessmentChat 
                  isOpen={true}
                  onClose={() => setShowAssessment(false)}
                  isEmbedded={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}