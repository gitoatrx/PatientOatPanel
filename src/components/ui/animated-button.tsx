"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const animatedButtonVariants = cva(
  "relative rounded-full flex items-center justify-center gap-2 overflow-hidden group border-2 whitespace-nowrap transition-colors duration-800 ease-in-out",
  {
    variants: {
      variant: {
        primary:
          "border-blue-600 bg-blue-600 text-white hover:bg-white hover:text-blue-600",
        secondary:
          "border-gray-500 bg-gray-500 text-white hover:bg-white hover:text-gray-500",
        success:
          "border-green-500 bg-green-500 text-white hover:bg-white hover:text-green-500",
        danger:
          "border-red-500 bg-red-500 text-white hover:bg-white hover:text-red-500",
      },
      size: {
        sm: "h-8 px-4",
        default: "h-10 px-6",
        lg: "h-14 px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof animatedButtonVariants> {
  children: React.ReactNode;
  showArrow?: boolean;
  arrowIcon?: React.ReactNode;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "default",
      className,
      showArrow = true,
      arrowIcon,
      ...props
    },
    ref,
  ) => {
    const defaultArrow = (
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.999 8.66624C13.6433 8.66624 14.1657 8.1439 14.1657 7.49957C14.1657 6.85524 13.6433 6.33291 12.999 6.33291L12.999 8.66624ZM1.68656 6.3329L0.519894 6.3329L0.519894 8.66623L1.68656 8.66623L1.68656 6.3329ZM12.999 6.33291L1.68656 6.3329L1.68656 8.66623L12.999 8.66624L12.999 6.33291Z"
          fill="currentColor"
        />
        <path
          d="M7.90918 2.40982L12.9998 7.50042L7.9092 12.591"
          stroke="currentColor"
          strokeWidth="2.33333"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        className={cn(animatedButtonVariants({ variant, size, className }))}
        {...props}
      >
        {/* Slide-in background effect */}
        <div className="absolute inset-0 bg-white transform -translate-x-full transition-transform duration-700 ease-in-out group-hover:translate-x-0"></div>

        {/* Content wrapper */}
        <div className="relative flex items-center gap-2">
          {/* Icon wrapper with animation */}
          <div className="relative overflow-hidden">
            <div className="flex items-center gap-2 transition-transform duration-700 ease-in-out group-hover:-translate-y-6">
              {children}
              {showArrow && (
                <span className="transition-transform duration-700 ease-in-out group-hover:translate-x-1">
                  {arrowIcon || defaultArrow}
                </span>
              )}
            </div>
            {/* Duplicate for the slide effect */}
            <div className="absolute top-6 left-0 flex items-center gap-2 transition-transform duration-700 ease-in-out group-hover:-translate-y-6">
              {children}
              {showArrow && (
                <span className="transition-transform duration-700 ease-in-out group-hover:translate-x-1">
                  {arrowIcon || defaultArrow}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  },
);

AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton, animatedButtonVariants };
