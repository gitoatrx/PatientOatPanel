import { Metadata } from "next";
import type { TelehealthChatMessage } from "@/components/telehealth";
import { TelehealthSessionContent } from "./TelehealthSessionContent";

export const metadata: Metadata = {
  title: "Telehealth Session",
};

const mockMessages: TelehealthChatMessage[] = [
  {
    id: "1",
    author: "Dr. Yagnik Devani",
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
    author: "Dr. Yagnik Devani",
    authoredAt: "10:03",
    content: "Great! Let's review your symptoms before we begin.",
  },
];

const mockParticipants = [
  { name: "Dr. Yagnik Devani", role: "Doctor" },
  { name: "You", role: "Patient" },
];

const SCHEDULED_TIME = "Today - 10:00 AM EST";
const SESSION_TITLE = "Consulting session";
const PROVIDER_NAME = "Dr. Yagnik Devani";

interface TelehealthPageProps {
  params: {
    sessionId: string;
  };
  searchParams?: {
    token?: string;
  };
}

export default async function TelehealthSessionPage({ params, searchParams }: TelehealthPageProps) {
  const { sessionId } = await params;
  const followupToken = typeof searchParams?.token === 'string' ? searchParams.token : '';
  const appointmentId = sessionId;

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
