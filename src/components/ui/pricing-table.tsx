import React from "react";
import { Check } from "lucide-react";
import { Button } from "./button";

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  addOns?: string[];
  buttonText: string;
  buttonVariant: "outline" | "default";
  highlighted?: boolean;
}

interface PricingTableProps {
  className?: string;
}

export function PricingTable({ className = "" }: PricingTableProps) {
  const plans: PricingPlan[] = [
    {
      name: "Bimble Hosted OSCAR",
      price: "$40",
      description: "/ month",
      features: [
        "LXD container hosting",
        "Custom subdomain",
        "Ongoing maintenance",
        "24/7 technical support",
        "Automatic backups",
        "SSL certificates",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
    },
    {
      name: "Bimble Pro",
      price: "$100",
      description: "/ month",
      features: [
        "Real-time dashboards",
        "Smart patient profiles",
        "Custom booking system",
        "Analytics & insights",
        "Patient engagement tools",
        "API integrations",
      ],
      addOns: ["Advanced analytics", "Custom integrations"],
      buttonText: "Start Free Trial",
      buttonVariant: "default",
      highlighted: true,
    },
    {
      name: "Self-Hosted OSCAR",
      price: "$25",
      description: "/ month",
      features: [
        "Installation support",
        "Secure setup configuration",
        "Documentation & guides",
        "Optional maintenance",
        "Community support",
        "Migration assistance",
      ],
      addOns: ["Custom Code Regions", "Webhooks support"],
      buttonText: "Get Started",
      buttonVariant: "outline",
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}>
      {plans.map((plan, index) => (
        <div
          key={index}
          className={`relative rounded-2xl p-8 flex flex-col ${
            plan.highlighted
              ? "bg-gray-900 border border-gray-700"
              : "bg-white border border-gray-200 shadow-sm"
          }`}
        >
          {/* Highlighted border effect */}
          {plan.highlighted && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-red-500/10 via-orange-500/10 to-green-500/10 -z-10" />
          )}

          {/* Plan Header */}
          <div className="text-center mb-8">
            <h3
              className={`text-sm font-medium mb-2 ${
                plan.highlighted ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {plan.name}
            </h3>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span
                className={`text-4xl font-bold ${
                  plan.highlighted ? "text-white" : "text-gray-900"
                }`}
              >
                {plan.price}
              </span>
              <span
                className={`text-sm ${
                  plan.highlighted ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {plan.description}
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8 flex-grow">
            {plan.features.map((feature, featureIndex) => (
              <div key={featureIndex} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span
                  className={`text-sm ${
                    plan.highlighted ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Add-ons */}
          {plan.addOns && plan.addOns.length > 0 && (
            <div className="mb-8">
              <h4
                className={`text-sm font-medium mb-3 ${
                  plan.highlighted ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Add ons:
              </h4>
              <div className="space-y-3">
                {plan.addOns.map((addon, addonIndex) => (
                  <div key={addonIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {addon}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button - positioned at bottom */}
          <div className="mt-auto pt-4">
            <Button
              variant={plan.buttonVariant}
              size="lg"
              className={`w-full ${
                plan.highlighted
                  ? "bg-white text-gray-900 hover:bg-gray-100"
                  : "bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200"
              }`}
            >
              {plan.buttonText}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
