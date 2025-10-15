"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useClinic } from "@/contexts/ClinicContext";

export default function HomePage() {
  const router = useRouter();
  const { clinicInfo, isLoading } = useClinic();

  const handleGetStarted = () => {
    router.push("/onboarding/patient/phone");
  };

  // Show loading state while fetching clinic data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading clinic information..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          {clinicInfo?.logo && (
            <div className="w-12 h-12 rounded-lg overflow-hidden mb-6">
              <Image
                src={clinicInfo.logo}
                alt={`${clinicInfo.name} logo`}
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <h1 className="text-4xl font-semibold text-gray-900 mb-3">
            {clinicInfo?.name}
          </h1>
        </div>

        {/* Main Content */}
        <div className="mb-12">
          <h2 className="text-2xl font-medium text-gray-800 mb-4">
            Let&apos;s get you started
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Book an appointment or follow-up in just a few steps.
          </p>
          
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium rounded-lg min-h-[56px] min-w-[160px]"
          >
            Get Started
          </Button>
        </div>

        {/* Simple Clinic Info */}
        <div className="border-t border-gray-200 pt-8">
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p>
                <strong>Location:</strong> {`${clinicInfo?.address}, ${clinicInfo?.city}, ${clinicInfo?.province}`}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinicInfo?.address}, ${clinicInfo?.city}, ${clinicInfo?.province}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm font-medium self-start sm:self-auto"
              >
                Get Directions
              </a>
            </div>
            <p><strong>Phone:</strong> {clinicInfo?.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

