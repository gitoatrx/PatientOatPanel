"use client";

import { useState } from "react";
// import { useCheckout, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface EmbeddedPaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EmbeddedPaymentForm({
  onSuccess,
  onCancel,
  isLoading = false,
}: EmbeddedPaymentFormProps) {
  // const checkout = useCheckout();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // if (!checkout) {
    //   toast({
    //     title: "Payment system not ready",
    //     description: "Please wait a moment and try again.",
    //     variant: "error",
    //   });
    //   return;
    // }

    setIsProcessing(true);

    try {
      // const result = await checkout.confirm();

      // if (result.type === "error") {
      //   // Show error to your customer (for example, payment details incomplete)
      //   toast({
      //     title: "Payment failed",
      //     description:
      //       result.error.message ||
      //       "Please check your payment details and try again.",
      //     variant: "error",
      //   });
      // } else {
      //   // Payment successful
      //   toast({
      //     title: "Payment successful!",
      //     description:
      //       "Your subscription has been activated with a 90-day free trial.",
      //     variant: "success",
      //   });
      //   onSuccess();
      // }

      // Temporary success for testing
      toast({
        title: "Payment integration disabled",
        description: "Payment functionality is temporarily disabled.",
        variant: "default",
      });
      onSuccess();
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment error",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Complete Your Payment</CardTitle>
        <CardDescription className="text-center">
          Get 90 days free, then $29/month. Cancel anytime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* <PaymentElement
              options={{
                layout: "tabs",
                paymentMethodOrder: ["card", "apple_pay", "google_pay"],
              }}
            /> */}
            <div className="p-4 border rounded-lg bg-gray-50 text-center">
              <p className="text-gray-600">
                Payment integration temporarily disabled
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing || isLoading}
            >
              {isProcessing ? "Processing..." : "Start Free Trial"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onCancel}
              disabled={isProcessing || isLoading}
            >
              Cancel
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            <p>Secure payment powered by Stripe</p>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
