"use client";

import { useEffect } from "react";

export default function OnboardingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Track onboarding page views for analytics
    console.log("Onboarding template rendered");

    // You could add analytics tracking here
    // analytics.track('onboarding_page_view', {
    //   path: window.location.pathname,
    //   timestamp: new Date().toISOString(),
    // });
  }, []);

  return <div className="onboarding-template">{children}</div>;
}
