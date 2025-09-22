"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Doctor = {
  id: string;
  name?: string;
  specialty?: string;
  rating?: number; // 0-5
  nextAvailable?: string; // e.g. "Today, 3:15 PM"
  yearsOfExperience?: number;
  clinic?: string;
  avatarUrl?: string;
};

interface DoctorCardProps {
  doctor: Doctor;
  selected?: boolean;
  onSelect?: (doctor: Doctor) => void;
  className?: string;
}

function getInitials(name: string | undefined | null) {
  if (!name || typeof name !== 'string') {
    return 'DR';
  }
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function colorFromId(id: string) {
  // Consistent professional medical color - Blue for trust and reliability
  return "#3B82F6"; // Blue - Trust, reliability, professional
}

export function DoctorCard({ doctor, selected, onSelect, className }: DoctorCardProps) {
  const initials = getInitials(doctor.name);
  const color = colorFromId(doctor.id);
  
  // Safety checks for undefined fields
  const safeName = doctor.name || 'Unknown Doctor';
  const safeSpecialty = doctor.specialty || 'General Practice';
  const safeNextAvailable = doctor.nextAvailable || 'Not available';
  const safeRating = doctor.rating || 0;

  return (
    <motion.button
      type="button"
      layout
      onClick={() => onSelect?.(doctor)}
      aria-pressed={selected}
      aria-label={`${safeName}, ${safeSpecialty}`}
      className={cn(
        "group relative w-full text-left p-3 rounded-xl border transition-all duration-200 bg-transparent",
        selected ? "border-primary ring-1 ring-primary/30" : "border-border",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div
            className="relative grid size-12 shrink-0 place-items-center rounded-full text-white font-bold text-sm overflow-hidden"
            style={{ background: color }}
            aria-hidden
          >
            <span>{initials}</span>
          </div>
        </div>

        {/* Doctor Information */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground">
            {safeName}
          </h3>
          <div className="mt-1">
            <p className="text-xs text-muted-foreground">{safeSpecialty}</p>
          </div>
          
          {/* Availability */}
          {/* <p
            className={cn(
              "text-xs mt-1",
              safeNextAvailable.toLowerCase().includes("today")
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {safeNextAvailable.toLowerCase().includes("today")
              ? "Available Today"
              : safeNextAvailable.toLowerCase().includes("tomorrow")
              ? "Available Tomorrow"
              : `Next: ${safeNextAvailable}`}
          </p> */}
        </div>

        {/* Right-side selector */}
        <div className="ml-2">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full border transition-colors",
              selected ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent",
            )}
            aria-hidden
          >
            <Check className="w-4 h-4" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}
