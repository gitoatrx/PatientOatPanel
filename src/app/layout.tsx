import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ClinicProvider } from "@/contexts/ClinicContext";
import { Toaster } from "@/components/ui/use-toast";

export const metadata: Metadata = {
  title: "123 Walkin Clinic - Bimble",
  description:
    "123 Walkin Clinic - Bimble is a telehealth platform that allows you to connect with your doctor from the comfort of your home.",
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
          <ClinicProvider>
            {children}
            <Toaster />
          </ClinicProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
