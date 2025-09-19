"use client";

import { ReactNode, useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChevronLeft, LogOut } from "lucide-react";
import { BimbleLogoIcon } from "@/../public/icons/icons";
// import { gsap } from "gsap"; // COMMENTED OUT FOR TESTING
import { BaseErrorBoundary } from "@/components/error-boundaries/BaseErrorBoundary";
// Removed tokenStorage import - not needed in UI-only mode

interface PatientStepShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
  footerExtra?: ReactNode;
  skipButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  progressPercent?: number; // 0-100
  progressText?: string; // Text to show in progress bar
  useCard?: boolean; // wrap content in Card (default true)
  contentMaxWidthClass?: string; // e.g., "max-w-xl" (default)
  onLogout?: () => void; // Customizable logout handler
  showLogout?: boolean; // Whether to show logout button
  currentStep?: number; // Current step number
  totalSteps?: number; // Total number of steps
}

export function PatientStepShell({
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  isNextDisabled,
  isSubmitting,
  footerExtra,
  skipButton,
  progressPercent,
  useCard = true,
  contentMaxWidthClass = "max-w-xl",
  onLogout,
  showLogout = true,
  // currentStep,
  // totalSteps,
}: PatientStepShellProps) {
  const [hasUserToken, setHasUserToken] = useState(false);

  // Check for patient token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasOnboardingToken = !!localStorage.getItem(
        "bimble_patient_onboarding_access_token",
      );
      // In UI-only mode, no token checking
      const hasRegularToken = false;
      setHasUserToken(hasOnboardingToken || hasRegularToken);
    }
  }, []);

  // Reset scroll only on initial mount (avoid jank on every re-render)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0 });
    }
  }, []);

  // Keep markup stable between server and client to avoid hydration mismatches
  const contentRef = useRef<HTMLDivElement | null>(null);
  // Removed isNavigating state for smoother navigation

  useEffect(() => {
    if (!contentRef.current) return;
    
    // Add subtle fade-up animation using CSS transitions
    const element = contentRef.current;
    
    // Set initial state
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    
    // Trigger animation on next frame
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
    
    // Cleanup function
    return () => {
      if (element) {
        element.style.transition = '';
      }
    };
  }, [title, description, progressPercent]);

  // Memoize event handlers to prevent serialization issues
  const handleBack = useCallback(async () => {
    if (onBack) {
      // Add subtle fade-out animation before navigation
      if (contentRef.current) {
        const element = contentRef.current;
        element.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        // Call onBack after animation completes
        setTimeout(async () => {
          try {
            await onBack();
            // If onBack succeeds, the page will navigate away
          } catch (error) {
            console.error("Error in onBack callback:", error);
            // Restore content with fade-in animation if navigation fails
            element.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
          }
        }, 300);
      } else {
        await onBack();
      }
    }
  }, [onBack]);

  const handleNext = useCallback(async () => {
    if (onNext) {
      try {
        // Add subtle fade-out animation before navigation
        if (contentRef.current) {
          const element = contentRef.current;
          element.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          element.style.opacity = '0';
          element.style.transform = 'translateY(-10px)';
          
          // Call onNext after animation completes
          setTimeout(async () => {
            try {
              await onNext();
              // If onNext succeeds, the page will navigate away
            } catch (error) {
              console.error("Error in onNext callback:", error);
              // Restore content with fade-in animation if navigation fails
              element.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
              element.style.opacity = '1';
              element.style.transform = 'translateY(0)';
            }
          }, 300);
        } else {
          await onNext();
        }
      } catch (error) {
        console.error("Error in handleNext:", error);
        // Fallback: call onNext without animation
        await onNext();
      }
    }
  }, [onNext]);

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
      return;
    }

    // Default patient logout behavior
    if (typeof window !== "undefined") {
      // Clear patient tokens from both localStorage and cookies
      localStorage.removeItem("bimble_patient_onboarding_access_token");
      localStorage.removeItem("bimble_patient_onboarding_refresh_token");
      localStorage.removeItem("bimble_patient_access_token");
      localStorage.removeItem("bimble_patient_refresh_token");
      localStorage.removeItem("bimble_patient_account_id");
      localStorage.removeItem("bimble_access_token");
      localStorage.removeItem("bimble_refresh_token");

      // Clear cookies
      document.cookie =
        "bimble_patient_onboarding_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "bimble_patient_onboarding_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "bimble_patient_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "bimble_patient_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "bimble_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "bimble_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    console.log("Logout clicked - redirect to login page");
  }, [onLogout]);

  return (
    <>
      {/* Fixed header + very top progress bar (no animation) */}
      {typeof progressPercent === "number" && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background">
          {/* Progress bar flush with the very top */}
          <div className="h-2 bg-muted border-r-rounded">
            <div
              className="h-full bg-primary"
              style={{
                width: `${progressPercent}%`,
                transition: "width 550ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Header row */}
          <div className="w-full pt-4 pb-4">
            <div
              className={`${contentMaxWidthClass} mx-auto px-4 sm:px-6 lg:px-8`}
            >
              <div className="flex items-center justify-between">
                <div className="w-24">
                  {onBack ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBack}
                      className="inline-flex items-center gap-1 h-8 px-3 border-border cursor-pointer"
                      disabled={isSubmitting}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {backLabel}
                    </Button>
                  ) : null}
                </div>
                <div className="flex-1 flex justify-center">
                  <Link
                    href="/"
                    aria-label="Bimble home"
                    className="cursor-pointer"
                  >
                    <BimbleLogoIcon className="w-7 h-7" />
                  </Link>
                </div>
                <div className="w-24 flex justify-end">
                  {showLogout && hasUserToken && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1 h-8 px-3 border-border text-destructive hover:text-destructive cursor-pointer"
                      disabled={isSubmitting}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`${contentMaxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-2 pb-20 ${
          typeof progressPercent === "number" ? "pt-10" : "pt-2"
        }`}
      >
        {/* Only middle content animates */}
        <div
          key={`${title}-${progressPercent}`}
          className="space-y-1 bg-background"
          ref={contentRef}
        >
          {title && description && (
            <div className="space-y-1">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold leading-tight">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
                {/* Step indicator removed as requested */}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {useCard ? (
              <Card className="p-6 sm:p-8">
                <BaseErrorBoundary
                  errorMessage="Something went wrong with this step. Please try again."
                  showHomeButton={false}
                  showBackButton={true}
                  showRetryButton={true}
                  onRetry={() => {
                    // Force a re-render by updating a key
                    window.location.reload();
                  }}
                >
                  {children}
                </BaseErrorBoundary>
              </Card>
            ) : (
              <BaseErrorBoundary
                errorMessage="Something went wrong with this step. Please try again."
                showHomeButton={false}
                showBackButton={true}
                showRetryButton={true}
                onRetry={() => {
                  // Force a re-render by updating a key
                  window.location.reload();
                }}
              >
                {children}
              </BaseErrorBoundary>
            )}
          </div>
        </div>
      </div>

      {/* Fixed footer at the bottom of the viewport (no animation) */}
      <div
        className={`fixed bottom-0 left-0 right-0 ${contentMaxWidthClass} mx-auto px-5 bg-background`}
      >
        <div
          className={`${contentMaxWidthClass} container mx-auto px-4 py-4 space-y-3`}
        >
          {footerExtra ? <div>{footerExtra}</div> : null}

          {skipButton && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full text-lg cursor-pointer"
              onClick={skipButton.onClick}
              disabled={skipButton.disabled}
            >
              {skipButton.label}
            </Button>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full text-lg text-white cursor-pointer"
            onClick={handleNext}
            disabled={!!isNextDisabled || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="text-white" />
                <span>Loading...</span>
              </>
            ) : (
              nextLabel
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
