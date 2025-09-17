"use client";

import * as React from "react";
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface CityComboboxOption {
  value: string;
  label: string;
  region: string;
}

interface CityComboboxProps {
  options: CityComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  onFocus?: () => void;
  onLocationDetect?: () => void;
  showLocationIcon?: boolean;
  loading?: boolean;
}

export function CityCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select city...",
  emptyMessage = "No cities found.",
  className,
  disabled = false,
  onFocus,
  onLocationDetect,
  showLocationIcon = true,
  loading = false,
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  // Filter options based on search value
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.region.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [options, searchValue]);

  // Group options by region
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, CityComboboxOption[]> = {};
    filteredOptions.forEach((option) => {
      const region = option.region || "Other";
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(option);
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

  // Update the handleFocus function
  const handleFocus = React.useCallback(() => {
    // Only open dropdown if there's a search value or options to show
    if (searchValue.trim() || options.length > 0) {
      setOpen(true);
    }
    onFocus?.();
  }, [onFocus, searchValue, options.length]);

  // Also update the handleInputClick function
  const handleInputClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Only open if there's content or options
      if (!open && (searchValue.trim() || options.length > 0)) {
        setOpen(true);
      }
    },
    [open, searchValue, options.length],
  );

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    // Clear search when closing
    if (!newOpen) {
      setSearchValue("");
    }
  }, []);

  const handleLocationClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onLocationDetect?.();
    },
    [onLocationDetect],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div ref={triggerRef} className="relative">
          {showLocationIcon && (
            <MapPin
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleLocationClick}
            />
          )}
          <input
            ref={inputRef}
            value={value || ""}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onClick={handleInputClick}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full h-14 rounded-md border-1 border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 cursor-text",
              showLocationIcon && "pl-10",
              "pr-10",
              className,
            )}
          />
          {/* Always show chevron, never show loader in input field */}
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
          {loading ? (
            <div className="px-3 py-4 text-sm text-gray-500 bg-white flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching cities...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 bg-white">
              {emptyMessage}
            </div>
          ) : (
            Object.entries(groupedOptions).map(([region, regionOptions]) => (
              <div key={region}>
                {regionOptions.map((option) => (
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
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 transition-opacity duration-200",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
