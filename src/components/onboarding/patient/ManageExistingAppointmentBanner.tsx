"use client";

import React from "react";
import { motion } from "framer-motion";
import { Calendar, AlertTriangle, Eye, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingReturningPatientDecisionAppointment } from "@/lib/types/api";

interface ManageExistingAppointmentBannerProps {
  appointment: OnboardingReturningPatientDecisionAppointment;
  onView?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
}

export function ManageExistingAppointmentBanner({
  appointment,
  onView,
  onCancel,
  onReschedule,
}: ManageExistingAppointmentBannerProps) {
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-blue-600';
      case 'confirmed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status || 'Unknown';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto mb-6"
    >
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-1">
              You already have an upcoming appointment
            </h3>
            <p className="text-sm text-amber-700">
              Please manage your existing appointment before booking a new one.
            </p>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">
              {formatDateTime(appointment.date_and_time || '')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              appointment.status?.toLowerCase() === 'pending' ? 'bg-blue-500' :
              appointment.status?.toLowerCase() === 'confirmed' ? 'bg-green-500' :
              'bg-gray-500'
            }`} />
            <span className={`text-sm font-medium ${getStatusColor(appointment.status || '')}`}>
              {getStatusLabel(appointment.status || '')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Button>
          )}
          
          {onReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReschedule}
              className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <RotateCcw className="w-4 h-4" />
              Reschedule
            </Button>
          )}
          
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              Cancel Appointment
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

