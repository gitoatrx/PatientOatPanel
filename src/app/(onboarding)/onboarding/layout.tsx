"use client";
import React from "react";
import CookieConsentBanner from "@/components/cookies/CookieConsentBanner";
import { Toaster } from "@/components/ui/use-toast";
import { BaseErrorBoundary } from "@/components/error-boundaries/BaseErrorBoundary";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-dm-sans antialiased">
      <BaseErrorBoundary
        errorMessage="Something went wrong with the onboarding process. Please try refreshing the page or contact support if the issue persists."
        showHomeButton={true}
        showBackButton={true}
        showRetryButton={true}
      >
        <main>{children}</main>
      </BaseErrorBoundary>
      <Toaster />
      <CookieConsentBanner />
    </div>
  );
}
