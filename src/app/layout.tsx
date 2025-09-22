import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/use-toast";

export const metadata: Metadata = {
  title: "123Walkin Clinic - OAT RX",
  description:
    "123Walkin Clinic - OAT RX is a telehealth platform that allows you to connect with your doctor from the comfort of your home.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`min-h-screen font-dm-sans antialiased bg-background text-foreground transition-colors`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
