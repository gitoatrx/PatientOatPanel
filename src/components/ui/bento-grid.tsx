"use client";

import React from "react";
import { BarChart3, Calendar, Users, FileText } from "lucide-react";
import { motion } from "framer-motion";
// Removed useScrollAnimation hook for UI-only mode

const bentoFeatures = [
  {
    title: "Dashboard Analytics",
    description:
      "Track your health metrics and appointment history with detailed insights",
    icon: BarChart3,
    color: "bg-blue-500",
    position: "col-span-1 row-span-1",
  },
  {
    title: "Appointment Management",
    description: "View, reschedule, and manage all your upcoming appointments",
    icon: Calendar,
    color: "bg-green-500",
    position: "col-span-1 row-span-1",
  },
  {
    title: "Provider Network",
    description: "Browse and connect with healthcare providers in your area",
    icon: Users,
    color: "bg-purple-500",
    position: "col-span-1 row-span-1",
  },
  {
    title: "Health Records",
    description: "Access and manage your medical documents and prescriptions",
    icon: FileText,
    color: "bg-orange-500",
    position: "col-span-1 row-span-1",
  },
];

interface BentoGridProps {
  className?: string;
}

export function BentoGrid({ className = "" }: BentoGridProps) {
  // Simplified for UI-only mode - no scroll animation
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = true; // Always show in UI-only mode

  // Animation variants for the grid container
  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
        staggerChildren: 0.2,
      },
    },
  };

  // Animation variants for individual cards
  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
      rotate: -10,
      y: 50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={`grid grid-cols-2 gap-4 ${className}`}
    >
      {bentoFeatures.map((feature, index) => {
        const IconComponent = feature.icon;
        return (
          <motion.div
            key={index}
            variants={cardVariants}
            className={`${feature.position} relative cursor-pointer`}
          >
            {/* Background Card */}
            <div
              className={`absolute inset-0 ${feature.color} rounded-2xl opacity-10 transition-opacity duration-300`}
            ></div>

            {/* Content Card */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 flex flex-col justify-between shadow-lg transition-all duration-300">
              {/* Icon */}
              <div
                className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
