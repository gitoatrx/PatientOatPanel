"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingReturningPatientDecisionAppointment } from "@/lib/types/api";

interface RescheduleSuggestionBannerProps {
  appointment: OnboardingReturningPatientDecisionAppointment;
  onReschedule?: () => void;
  onDismiss?: () => void;
}

export function RescheduleSuggestionBanner({
  appointment,
  onReschedule,
  onDismiss,
}: RescheduleSuggestionBannerProps) {
  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return "Date not available";
    
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateTimeString;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto mb-6"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              Previous appointment was a no-show
            </h3>
            <p className="text-sm text-blue-700">
              You can reschedule your previous appointment or book a new one.
            </p>
          </div>
        </div>

        {/* Previous Appointment Details */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">
              {formatDateTime(appointment.date_and_time || '')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-600">
              No Show
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReschedule}
              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <RotateCcw className="w-4 h-4" />
              Reschedule Previous
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-blue-600 hover:bg-blue-100"
            >
              Continue with new booking
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

