"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowRight, CheckCircle } from "lucide-react";

export default function TestReschedulePage() {
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess(true);
    }
  }, [searchParams]);

  const mockAppointment = {
    id: 14840,
    doctor: { first_name: "RAPHAEL", last_name: "AJAYI" },
    visit_type_name: "Virtual (15 min) - Video Call",
    scheduled_for: "2025-10-17T12:00:00Z",
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Success!</CardTitle>
            <CardDescription>
              Your appointment has been successfully rescheduled.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/test-reschedule">
              <Button variant="outline" className="w-full">
                Test Another Reschedule
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Test Reschedule Appointment</CardTitle>
          <CardDescription className="text-center">
            Test the reschedule appointment functionality with different route structures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Mock Appointment Data:</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><strong>Appointment ID:</strong> {mockAppointment.id}</p>
              <p><strong>Doctor:</strong> Dr. {mockAppointment.doctor.first_name} {mockAppointment.doctor.last_name}</p>
              <p><strong>Visit Type:</strong> {mockAppointment.visit_type_name}</p>
              <p><strong>Scheduled For:</strong> {new Date(mockAppointment.scheduled_for).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Routes:</h3>
            <div className="space-y-3">
              <Link href={`/reschedule-appointment/4/8ec0c1fa-c217-4807-b69b-6083d42ea23e`}>
                <Button className="w-full flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Reschedule Appointment (Real API Token)
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href={`/reschedule-appointment/4/test-token-123`}>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Reschedule Appointment (Test Token)
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Route Structure:</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>New Route:</strong> <code>/reschedule-appointment/[clinicId]/[followuptoken]</code>
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Example: <code>/reschedule-appointment/4/14840:test-token-123</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
