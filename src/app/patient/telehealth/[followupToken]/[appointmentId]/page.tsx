import { Metadata } from "next";
import { TelehealthSessionContent } from "@/app/patient/telehealth/[followupToken]/[appointmentId]/TelehealthSessionContent";

export const metadata: Metadata = {
  title: "Patient Telehealth Session",
  description: "Join your telehealth appointment with your healthcare provider",
};

const mockParticipants = [
  { name: "RAPHAEL AJAYI", role: "Doctor" },
  { name: "You", role: "Patient" },
];

const SCHEDULED_TIME = "Today - 10:00 AM EST";
const SESSION_TITLE = "Consulting session";
const PROVIDER_NAME = "RAPHAEL AJAYI";

interface PatientTelehealthPageProps {
  params: Promise<{
    followupToken: string;
    appointmentId: string;
  }>;
}

export default async function PatientTelehealthSessionPage({ params }: PatientTelehealthPageProps) {
  const { followupToken, appointmentId } = await params;

  // For now, we'll use the appointmentId as the sessionId
  const sessionId = appointmentId;

  return (
    <TelehealthSessionContent
      sessionId={sessionId}
      scheduledTime={SCHEDULED_TIME}
      providerName={PROVIDER_NAME}
      sessionTitle={SESSION_TITLE}
      participants={mockParticipants}
      messages={[]}
      followupToken={followupToken}
      appointmentId={appointmentId}
    />
  );
}
