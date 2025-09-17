"use client";

// import { CheckoutProvider } from "@stripe/react-stripe-js";
// import { loadStripe } from "@stripe/stripe-js";
import { ReactNode } from "react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
// const stripePromise = loadStripe(
//   process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
// );

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  // const _fetchClientSecret = async () => {
  //   try {
  //     const response = await fetch("/api/stripe/create-payment-intent", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         // Add any necessary data for creating the payment intent
  //         amount: 2900, // $29.00 in cents
  //         currency: "usd",
  //       }),
  //     });

  //     const data = await response.json();
  //     return data.clientSecret;
  //   } catch (error) {
  //     console.error("Error fetching client secret:", error);
  //     throw error;
  //   }
  // };

  return (
    // <CheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
    { children }
    // </CheckoutProvider>
  );
}
