import { Metadata } from "next";
import { TelehealthSessionContent } from "@/app/patient/telehealth/[followupToken]/[appointmentId]/TelehealthSessionContent";

export const metadata: Metadata = {
  title: "Patient Telehealth Session",
  description: "Join your telehealth appointment with your healthcare provider",
};

const mockParticipants = [
  { name: "", role: "Doctor" },
  { name: "You", role: "Patient" },
];

const SCHEDULED_TIME = "Today - 10:00 AM EST";
const SESSION_TITLE = "Consulting session";

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

  // TODO: Fetch appointment data from API to get dynamic provider name
  // const appointmentData = await fetchAppointmentData(appointmentId, followupToken);
  // const providerName = appointmentData.providerName || "Healthcare Provider";
  // const sessionTitle = appointmentData.sessionTitle || SESSION_TITLE;
  
  // For now, using empty provider name - will be replaced with real data from API
  const providerName = "";
  const sessionTitle = SESSION_TITLE;

  return (
    <TelehealthSessionContent
      sessionId={sessionId}
      scheduledTime={SCHEDULED_TIME}
      providerName={providerName}
      sessionTitle={sessionTitle}
      participants={mockParticipants}
      messages={[]}
      followupToken={followupToken}
      appointmentId={appointmentId}
    />
  );
}
