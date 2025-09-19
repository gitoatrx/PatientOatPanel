"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { Doctor, DoctorCard } from "./DoctorCard";

interface DoctorListProps {
  doctors: Doctor[];
  showSearch?: boolean;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
};

export function DoctorList({ doctors, showSearch = true, className }: DoctorListProps) {
  const { watch, setValue } = useFormContext();
  const selectedDoctorId: string | undefined = watch("doctorId");

  const handleSelect = (doc: Doctor) => setValue("doctorId", doc.id, { shouldValidate: false, shouldDirty: true });

  return (
    <div className={className}>
      {/* Single column layout */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <AnimatePresence initial={false}>
          {doctors.map((doc, index) => (
            <motion.div
              key={doc.id}
              variants={itemVariants}
              layout
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <DoctorCard doctor={doc} selected={selectedDoctorId === doc.id} onSelect={handleSelect} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
