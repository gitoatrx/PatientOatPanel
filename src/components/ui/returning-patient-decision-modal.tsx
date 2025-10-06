"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle, ArrowRight, Info } from "lucide-react";
import { OnboardingReturningPatientDecision, OnboardingReturningPatientDecisionAppointment } from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface ReturningPatientDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'start_new' | 'reschedule' | 'manage') => void;
  decision: OnboardingReturningPatientDecision;
}

export function ReturningPatientDecisionModal({
  isOpen,
  onClose,
  onAction,
  decision,
}: ReturningPatientDecisionModalProps) {
  if (!isOpen) return null;

  const { action, latest_appointment } = decision;

  const getActionIcon = () => {
    switch (action) {
      case 'start_new':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case 'reschedule':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'manage':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default:
        return <Info className="h-5 w-5 text-slate-600" />;
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'start_new':
        return 'emerald';
      case 'reschedule':
        return 'blue';
      case 'manage':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const getActionTitle = () => {
    switch (action) {
      case 'start_new':
        return "Start New Appointment";
      case 'reschedule':
        return "Reschedule Existing Appointment";
      case 'manage':
        return "Manage Upcoming Appointment";
      default:
        return "Appointment Action Required";
    }
  };

  const getActionDescription = () => {
    switch (action) {
      case 'start_new':
        return "You can proceed with booking a new appointment. Your previous appointment information will be preserved.";
      case 'reschedule':
        return "We recommend rescheduling your existing appointment instead of creating a new one to avoid conflicts.";
      case 'manage':
        return "You have an upcoming appointment that needs attention. Please manage it before proceeding.";
      default:
        return "Please review your appointment status before continuing.";
    }
  };

  const getActionSubtext = () => {
    switch (action) {
      case 'start_new':
        return "This is the recommended action for your situation.";
      case 'reschedule':
        return "This helps avoid scheduling conflicts and ensures continuity of care.";
      case 'manage':
        return "Please take action on your existing appointment before booking a new one.";
      default:
        return "Choose the most appropriate action for your needs.";
    }
  };

  const getActionButtonText = () => {
    switch (action) {
      case 'start_new':
        return "Continue with New Appointment";
      case 'reschedule':
        return "Reschedule Appointment";
      case 'manage':
        return "Manage Appointment";
      default:
        return "Continue";
    }
  };

  const getActionButtonVariant = () => {
    switch (action) {
      case 'start_new':
        return "default" as const;
      case 'reschedule':
        return "default" as const;
      case 'manage':
        return "destructive" as const;
      default:
        return "default" as const;
    }
  };

  const formatAppointmentDate = (dateTime: string) => {
    try {
      // Parse the ISO string directly to avoid timezone conversion issues
      const date = new Date(dateTime);
      
      // Format without timezone conversion to preserve the original date
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      const weekday = weekdays[date.getUTCDay()];
      const monthName = months[month];
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      return `${weekday}, ${monthName} ${day}, ${year} at ${formattedTime}`;
    } catch (error) {
      // Fallback: just show the date part without timezone conversion
      const datePart = dateTime.split('T')[0];
      const timePart = dateTime.split('T')[1]?.split('-')[0] || '';
      return `${datePart} ${timePart}`;
    }
  };

  const getStatusBadge = (appointment: OnboardingReturningPatientDecisionAppointment) => {
    if (appointment.is_no_show) {
      return <Badge variant="destructive">No Show</Badge>;
    }
    if (appointment.has_passed) {
      return <Badge variant="secondary">Past</Badge>;
    }
    if (appointment.status === 'pending') {
      return <Badge variant="default">Upcoming</Badge>;
    }
    return <Badge variant="outline">{appointment.status}</Badge>;
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case 'past':
        return "This appointment has already passed";
      case 'no_show':
        return "You missed this appointment";
      case 'upcoming':
        return "You have an upcoming appointment";
      case 'unknown':
        return "Appointment status is unclear";
      default:
        return `Reason: ${reason}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="p-6">
          {/* Clean Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                action === 'start_new' && "bg-emerald-100 dark:bg-emerald-900/30",
                action === 'reschedule' && "bg-blue-100 dark:bg-blue-900/30", 
                action === 'manage' && "bg-amber-100 dark:bg-amber-900/30"
              )}>
                {getActionIcon()}
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {getActionTitle()}
              </h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {getActionDescription()}
            </p>
          </div>

          {/* Appointment Date - Simple */}
          {latest_appointment?.date_and_time && (
            <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>{formatAppointmentDate(latest_appointment.date_and_time)}</span>
              </div>
            </div>
          )}

          {/* Clean Actions */}
          <div className="space-y-2">
            <Button
              onClick={() => onAction(action)}
              variant={getActionButtonVariant()}
              size="default"
              className="w-full"
            >
              {getActionButtonText()}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="default"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
