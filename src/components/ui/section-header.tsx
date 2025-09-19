import React from "react";

interface SectionHeaderProps {
  /** The main heading text (before the italic part) */
  heading: string;
  /** The italic emphasized text within the heading */
  italicText: string;
  /** Optional text after the italic part */
  headingAfter?: string;
  /** The subheading/description text */
  subheading: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Custom styling for the heading */
  headingClassName?: string;
  /** Custom styling for the subheading */
  subheadingClassName?: string;
}

export function SectionHeader({
  heading,
  italicText,
  headingAfter,
  subheading,
  className = "",
  headingClassName = "",
  subheadingClassName = "",
}: SectionHeaderProps) {
  return (
    <div className={`text-center mb-16 ${className}`}>
      <h2
        className={`text-5xl lg:text-6xl font-bold text-foreground mb-6 transition-colors duration-300 ${headingClassName}`}
      >
        {heading}{" "}
        <em className="italic font-serif font-light text-primary  transition-colors duration-300">
          {italicText}
        </em>
        {headingAfter && headingAfter}
      </h2>
      <p
        className={`text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed transition-colors duration-300 ${subheadingClassName}`}
      >
        {subheading}
      </p>
    </div>
  );
}
