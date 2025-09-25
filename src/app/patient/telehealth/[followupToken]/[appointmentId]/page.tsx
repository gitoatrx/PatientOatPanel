import { Metadata } from "next";
import type { TelehealthChatMessage } from "@/components/telehealth";
import { TelehealthSessionContent } from "@/app/patient/telehealth/[followupToken]/[appointmentId]/TelehealthSessionContent";

export const metadata: Metadata = {
  title: "Patient Telehealth Session",
  description: "Join your telehealth appointment with your healthcare provider",
};

const mockMessages: TelehealthChatMessage[] = [
  {
    id: "1",
    author: "RAPHAEL AJAYI",
    authoredAt: "10:01",
    content: "Hello, thanks for joining today.",
  },
  {
    id: "2",
    author: "You",
    authoredAt: "10:02",
    content: "Hi doctor, I can see and hear you well.",
    isOwn: true,
  },
  {
    id: "3",
    author: "RAPHAEL AJAYI",
    authoredAt: "10:03",
    content: "Great! Let's review your symptoms before we begin.",
  },
];

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
      messages={mockMessages}
      followupToken={followupToken}
      appointmentId={appointmentId}
    />
  );
}
