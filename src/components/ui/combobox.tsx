"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  category?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  showSearchIcon?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  displayValue?: (value: string) => string; // Add this prop
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyMessage = "No options found.",
  className,
  disabled = false,
  showSearchIcon = true,
  onFocus,
  onBlur, // Add this parameter
  displayValue,
  onKeyDown,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  // Filter options based on search value
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [options, searchValue]);

  // Group options by category
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, ComboboxOption[]> = {};
    filteredOptions.forEach((option) => {
      const category = option.category || "other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(option);
    });
    return groups;
  }, [filteredOptions]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchValue(newValue);
      onValueChange(newValue); // Allow editing by updating parent state during typing
      setOpen(true);
    },
    [onValueChange],
  );

  const handleSelect = React.useCallback(
    (optionValue: string) => {
      onValueChange(optionValue);
      setOpen(false);
      setSearchValue(""); // Clear search when option is selected
    },
    [onValueChange],
  );

  const handleFocus = React.useCallback(() => {
    setOpen(true);
    onFocus?.();
  }, [onFocus]);

  const handleInputClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!open) {
        setOpen(true);
      }
    },
    [open],
  );

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    // Clear search when closing
    if (!newOpen) {
      setSearchValue("");
    }
  }, []);

  // Get display value
  const getDisplayValue = (val: string) => {
    if (displayValue) return displayValue(val);
    return val;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div ref={triggerRef} className="relative">
          {showSearchIcon && (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10 text-gray-600" />
          )}
          <input
            ref={inputRef}
            value={getDisplayValue(value || "")}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={onBlur} // Add this line
            onClick={handleInputClick}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full h-14 rounded-md border-1 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none  focus-visible:ring-ring focus-visible:ring-offset-2 cursor-text",
              showSearchIcon && "pl-10",
              "pr-10",
              className,
            )}
          />
          <ChevronsUpDown
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600",
            )}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 border-1 border-input bg-background rounded-none"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Only prevent closing if clicking inside the trigger area
          if (e.target && triggerRef.current?.contains(e.target as Node)) {
            e.preventDefault();
            e.stopPropagation();
          }
          // Let it close for all other outside clicks
        }}
      >
        <div className="max-h-80 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 bg-white">
              {emptyMessage}
            </div>
          ) : (
            Object.entries(groupedOptions).map(
              ([category, categoryOptions]) => (
                <div key={category}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide bg-gray-50 border-b border-input">
                    {getCategoryDisplayName(category)}
                  </div>
                  {categoryOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "w-full px-3 py-2 text-sm text-gray-800 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors text-left flex items-center justify-between border-none bg-white",
                        value === option.value && "bg-blue-50 text-blue-600",
                      )}
                      style={{
                        fontSmooth: "antialiased",
                        WebkitFontSmoothing: "antialiased",
                        MozOsxFontSmoothing: "grayscale",
                      }}
                    >
                      <span>{option.label}</span>
                      <Check
                        className={cn(
                          "h-4 w-4 transition-opacity duration-200",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </button>
                  ))}
                </div>
              ),
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to get display names for categories
function getCategoryDisplayName(category: string): string {
  switch (category) {
    case "health-conditions":
      return "Top Specialties";
    case "popular":
      return "Popular Specialties";
    case "more":
      return "All Specialties";
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
