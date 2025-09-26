import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patient Portal",
  description: "Access your healthcare services and appointments",
};

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}




