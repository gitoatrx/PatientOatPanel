import React from "react";
import { Check, X } from "lucide-react";

interface ComparisonFeature {
  name: string;
  qwertyHosted: string | boolean;
  bimblePro: string | boolean;
  selfHosted: string | boolean;
}

interface ComparisonTableProps {
  features: ComparisonFeature[];
  className?: string;
}

export function ComparisonTable({
  features,
  className = "",
}: ComparisonTableProps) {
  const renderValue = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-5 h-5 text-green-600" />
      ) : (
        <X className="w-5 h-5 text-red-500" />
      );
    }
    return <span className="text-sm font-medium text-center">{value}</span>;
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-background shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b border-border relative">
        <div className="grid grid-cols-4 divide-x divide-border">
          <div className="p-4 lg:p-6 text-center">
            <h3 className="text-base lg:text-lg font-bold text-foreground">
              Features
            </h3>
          </div>
          <div className="p-4 lg:p-6 text-center">
            <h3 className="text-base lg:text-lg font-bold text-blue-600 dark:text-blue-400">
              Bimble Hosted OSCAR
            </h3>
          </div>
          <div className="p-4 lg:p-6 text-center relative">
            {/* Most Popular Badge - positioned relative to the cell */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                Most Popular
              </span>
            </div>
            <h3 className="text-base lg:text-lg font-bold text-green-600 dark:text-green-400">
              Bimble Pro
            </h3>
          </div>
          <div className="p-4 lg:p-6 text-center">
            <h3 className="text-base lg:text-lg font-bold text-purple-600 dark:text-purple-400">
              Self-Hosted OSCAR
            </h3>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="divide-y divide-border">
        {features.map((feature, index) => (
          <div
            key={index}
            className="grid grid-cols-4 divide-x divide-border hover:bg-muted/30 transition-colors"
          >
            <div className="p-4 lg:p-6 flex items-center">
              <span className="font-semibold text-foreground text-sm lg:text-base">
                {feature.name}
              </span>
            </div>
            <div className="p-4 lg:p-6 flex items-center justify-center">
              {renderValue(feature.qwertyHosted)}
            </div>
            <div className="p-4 lg:p-6 flex items-center justify-center bg-green-50/30 dark:bg-green-950/20">
              {renderValue(feature.bimblePro)}
            </div>
            <div className="p-4 lg:p-6 flex items-center justify-center">
              {renderValue(feature.selfHosted)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer with pricing */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-border">
        <div className="grid grid-cols-4 divide-x divide-border">
          <div className="p-4 lg:p-6 text-center">
            <span className="text-sm font-semibold text-muted-foreground">
              Starting Price
            </span>
          </div>
          <div className="p-4 lg:p-6 text-center">
            <div className="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">
              $40
            </div>
            <div className="text-xs lg:text-sm text-muted-foreground">
              /month
            </div>
          </div>
          <div className="p-4 lg:p-6 text-center bg-green-50/50 dark:bg-green-950/30">
            <div className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
              $100
            </div>
            <div className="text-xs lg:text-sm text-muted-foreground">
              /month
            </div>
          </div>
          <div className="p-4 lg:p-6 text-center">
            <div className="text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-400">
              $25
            </div>
            <div className="text-xs lg:text-sm text-muted-foreground">
              /month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
