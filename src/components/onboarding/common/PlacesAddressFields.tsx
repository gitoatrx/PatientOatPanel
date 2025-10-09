"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { CANADIAN_PROVINCES } from "@/lib/constants/canadian-provinces";
import { useLocationDetection } from "@/lib/hooks/useLocationDetection";
import { useEnterKey } from "@/lib/hooks/useEnterKey";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2, MapPin } from "lucide-react";
import { useGooglePlacesAutocomplete } from "@/lib/hooks/useGooglePlacesAutocomplete";

interface AddressSuggestion {
  value: string;
  label: string;
  description: string;
}
interface CityOption {
  value: string;
  label: string;
  region?: string;
}

export interface PlacesAddressFieldsProps {
  fieldNames: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  labels?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  placeholders?: {
    street?: string;
    city?: string;
    postalCode?: string;
  };
  countryRestriction?: string; // default "ca"
  filterToBritishColumbia?: boolean; // default true
  onValidNext?: () => void; // called on Enter if valid
  searchMode?: "address" | "clinic"; // default "address" - clinic mode searches for medical establishments
}

export function PlacesAddressFields({
  fieldNames,
  labels,
  placeholders,
  countryRestriction = "ca",
  filterToBritishColumbia = true,
  onValidNext,
  searchMode = "address",
}: PlacesAddressFieldsProps) {
  const {
    watch,
    setValue: rhfSetValue,
    trigger,
    formState: { errors },
  } = useFormContext<Record<string, unknown>>();
  const setValue = useCallback(
    (
      name: string,
      value: unknown,
      options?: {
        shouldValidate?: boolean;
        shouldTouch?: boolean;
        shouldDirty?: boolean;
      },
    ) => rhfSetValue(name as never, value as never, options),
    [rhfSetValue],
  );
  const streetValue = watch(fieldNames.street) as string | undefined;
  const cityValue = watch(fieldNames.city) as string | undefined;
  const postalValue = watch(fieldNames.postalCode) as string | undefined;

  const {
    city: detectedCity,
    cityLoading,
    cityError,
    detectLocation,
    searchBCCities,
    bcCities,
    showCityDropdown,
    setShowCityDropdown,
  } = useLocationDetection();

  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressSearchValue, setAddressSearchValue] = useState(
    (streetValue as string) || "",
  );
  const [addressLoading, setAddressLoading] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const addressTriggerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedAddressValue, setSelectedAddressValue] = useState<string>("");
  const {
    isLoaded: isGoogleLoaded,
    getPredictions,
    getPlaceDetails,
  } = useGooglePlacesAutocomplete();

  const enterKeyHandler = useEnterKey(() => {
    // Let the parent form handle validation
    onValidNext?.();
  });

  // Google Places loading is handled by hook

  useEffect(() => {
    // Only auto-detect location if no city is set and we haven't already detected one
    // This prevents unnecessary location requests since we now handle it earlier in onboarding
    if (!cityValue && !detectedCity) {
      // Check if we have a cached location from earlier in the onboarding process
      const cachedLocation = localStorage.getItem('patient-detected-location');
      if (cachedLocation) {
        setValue(fieldNames.city, cachedLocation, {
          shouldValidate: true,
          shouldTouch: true,
        });
      } else {
        // Only detect location if no cached location exists
        detectLocation();
      }
    }
  }, [cityValue, detectedCity, detectLocation, setValue, fieldNames.city]);
  useEffect(() => {
    if (detectedCity && !cityValue)
      rhfSetValue(fieldNames.city as never, detectedCity as never);
  }, [detectedCity, cityValue, fieldNames.city, rhfSetValue]);

  // Sync addressSearchValue with form value
  useEffect(() => {
    setAddressSearchValue((streetValue as string) || "");
  }, [streetValue]);

  const searchAddresses = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 3 || !isGoogleLoaded) {
        setAddressSuggestions([]);
        setAddressLoading(false);
        return;
      }
      setAddressLoading(true);

      // Determine search types based on search mode
      // Note: Google Places API doesn't allow mixing "establishment" with other types
      let searchTypes: string[];

      if (searchMode === "clinic") {
        // For clinic mode, try establishment first, then fallback to address if needed
        // This allows searching for both medical facilities and regular addresses
        searchTypes = ["establishment"];
      } else {
        // For regular mode, use address type
        searchTypes = ["address"];
      }

      // For clinic mode, we'll do a two-step search: establishment first, then address if needed
      if (searchMode === "clinic") {
        // First, search for establishments
        getPredictions(query, {
          country: countryRestriction,
          types: ["establishment"],
        })
          .then((establishmentPredictions) => {
            // Filter establishment results
            const filteredEstablishments = establishmentPredictions.filter(
              (pred) => {
                if (!filterToBritishColumbia) return true;
                return (
                  pred.description.includes("British Columbia") ||
                  pred.description.includes("BC")
                );
              },
            );

            // If we have enough establishment results (3 or more), use them
            if (filteredEstablishments.length >= 3) {
              const suggestions = filteredEstablishments.map((prediction) => ({
                value: prediction.place_id,
                label:
                  prediction.structured_formatting?.main_text ||
                  prediction.description,
                description:
                  prediction.structured_formatting?.secondary_text || "",
              }));

              const queryLower = query.toLowerCase();
              const sortedSuggestions = suggestions.sort((a, b) => {
                const aLabelLower = a.label.toLowerCase();
                const bLabelLower = b.label.toLowerCase();

                // Prioritize medical establishments
                const aIsMedical =
                  aLabelLower.includes("clinic") ||
                  aLabelLower.includes("hospital") ||
                  aLabelLower.includes("medical") ||
                  aLabelLower.includes("health") ||
                  aLabelLower.includes("care");
                const bIsMedical =
                  bLabelLower.includes("clinic") ||
                  bLabelLower.includes("hospital") ||
                  bLabelLower.includes("medical") ||
                  bLabelLower.includes("health") ||
                  bLabelLower.includes("care");

                if (aIsMedical && !bIsMedical) return -1;
                if (!aIsMedical && bIsMedical) return 1;

                // Then sort by relevance to query
                if (
                  aLabelLower.startsWith(queryLower) &&
                  !bLabelLower.startsWith(queryLower)
                )
                  return -1;
                if (
                  !aLabelLower.startsWith(queryLower) &&
                  bLabelLower.startsWith(queryLower)
                )
                  return 1;
                return aLabelLower.localeCompare(bLabelLower);
              });

              setAddressSuggestions(sortedSuggestions);
              setAddressOpen(sortedSuggestions.length > 0);
              setAddressLoading(false);
            } else {
              // If not enough establishments, also search for addresses
              getPredictions(query, {
                country: countryRestriction,
                types: ["address"],
              })
                .then((addressPredictions) => {
                  const filteredAddresses = addressPredictions.filter(
                    (pred) => {
                      if (!filterToBritishColumbia) return true;
                      return (
                        pred.description.includes("British Columbia") ||
                        pred.description.includes("BC")
                      );
                    },
                  );

                  // Combine establishment and address results
                  const allPredictions = [
                    ...filteredEstablishments,
                    ...filteredAddresses,
                  ];
                  const suggestions = allPredictions.map((prediction) => ({
                    value: prediction.place_id,
                    label:
                      prediction.structured_formatting?.main_text ||
                      prediction.description,
                    description:
                      prediction.structured_formatting?.secondary_text || "",
                  }));

                  const queryLower = query.toLowerCase();
                  const sortedSuggestions = suggestions.sort((a, b) => {
                    const aLabelLower = a.label.toLowerCase();
                    const bLabelLower = b.label.toLowerCase();

                    // Prioritize medical establishments
                    const aIsMedical =
                      aLabelLower.includes("clinic") ||
                      aLabelLower.includes("hospital") ||
                      aLabelLower.includes("medical") ||
                      aLabelLower.includes("health") ||
                      aLabelLower.includes("care");
                    const bIsMedical =
                      bLabelLower.includes("clinic") ||
                      bLabelLower.includes("hospital") ||
                      bLabelLower.includes("medical") ||
                      bLabelLower.includes("health") ||
                      bLabelLower.includes("care");

                    if (aIsMedical && !bIsMedical) return -1;
                    if (!aIsMedical && bIsMedical) return 1;

                    // Then sort by relevance to query
                    if (
                      aLabelLower.startsWith(queryLower) &&
                      !bLabelLower.startsWith(queryLower)
                    )
                      return -1;
                    if (
                      !aLabelLower.startsWith(queryLower) &&
                      bLabelLower.startsWith(queryLower)
                    )
                      return 1;
                    return aLabelLower.localeCompare(bLabelLower);
                  });

                  setAddressSuggestions(sortedSuggestions);
                  setAddressOpen(sortedSuggestions.length > 0);
                  setAddressLoading(false);
                })
                .catch(() => {
                  setAddressLoading(false);
                  setAddressSuggestions([]);
                  setAddressOpen(false);
                });
            }
          })
          .catch(() => {
            setAddressLoading(false);
            setAddressSuggestions([]);
            setAddressOpen(false);
          });
      } else {
        // Regular address search for non-clinic mode
        getPredictions(query, {
          country: countryRestriction,
          types: searchTypes,
        })
          .then((predictions) => {
            setAddressLoading(false);
            const filtered = predictions.filter((pred) => {
              if (!filterToBritishColumbia) return true;
              return (
                pred.description.includes("British Columbia") ||
                pred.description.includes("BC")
              );
            });

            const suggestions = filtered.map((prediction) => ({
              value: prediction.place_id,
              label:
                prediction.structured_formatting?.main_text ||
                prediction.description,
              description:
                prediction.structured_formatting?.secondary_text || "",
            }));

            const queryLower = query.toLowerCase();
            const sortedSuggestions = suggestions.sort((a, b) => {
              const aLabelLower = a.label.toLowerCase();
              const bLabelLower = b.label.toLowerCase();

              // Sort by relevance to query
              if (
                aLabelLower.startsWith(queryLower) &&
                !bLabelLower.startsWith(queryLower)
              )
                return -1;
              if (
                !aLabelLower.startsWith(queryLower) &&
                bLabelLower.startsWith(queryLower)
              )
                return 1;
              if (
                aLabelLower.includes(queryLower) &&
                !bLabelLower.includes(queryLower)
              )
                return -1;
              if (
                !aLabelLower.includes(queryLower) &&
                bLabelLower.includes(queryLower)
              )
                return 1;
              return aLabelLower.localeCompare(bLabelLower);
            });
            setAddressSuggestions(sortedSuggestions);
            setAddressOpen(sortedSuggestions.length > 0);
          })
          .catch(() => {
            setAddressLoading(false);
            setAddressSuggestions([]);
            setAddressOpen(false);
          });
      }
    },
    [
      countryRestriction,
      filterToBritishColumbia,
      isGoogleLoaded,
      getPredictions,
      searchMode,
    ],
  );

  const debouncedAddressSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(
        () => searchAddresses(query),
        300,
      );
    },
    [searchAddresses],
  );
  useEffect(
    () => () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    },
    [],
  );

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Za-z0-9]/g, "");
    const current = (
      typeof postalValue === "string" ? postalValue : ""
    ).replace(/[^A-Za-z0-9]/g, "");
    if (value.length > current.length) {
      if (value.length >= 3) value = value.slice(0, 3) + " " + value.slice(3);
      if (value.length >= 7) value = value.slice(0, 7);
    }
    setValue(fieldNames.postalCode, value, {
      shouldValidate: true,
      shouldTouch: true,
    });
  };
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(fieldNames.city, value, {
      shouldValidate: true,
      shouldTouch: true,
    });
    if (value.trim()) searchBCCities(value);
    else setShowCityDropdown(false);
  };
  const handleCitySelect = (city: CityOption) => {
    setValue(fieldNames.city, city.label, {
      shouldValidate: true,
      shouldTouch: true,
    });
    setShowCityDropdown(false);
  };

  const parseAddressComponents = (
    components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>,
  ) => {
    const result = { street: "", city: "", province: "", postalCode: "" };
    let streetNumber = "";
    let route = "";
    
    // Debug logging to see what components we're getting
    console.log('Address components:', components);
    
    components.forEach((component) => {
      const types = component.types;
      console.log(`Component: ${component.long_name}, Types: ${types.join(', ')}`);
      
      if (types.includes("street_number")) {
        streetNumber = component.long_name;
      } else if (types.includes("route")) {
        route = component.long_name;
      } else if (types.includes("locality")) {
        result.city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        result.province = component.short_name;
      } else if (types.includes("postal_code")) {
        result.postalCode = component.long_name;
      }
    });
    
    // Combine street number and route properly
    if (streetNumber && route) {
      result.street = `${streetNumber} ${route}`;
    } else if (streetNumber) {
      result.street = streetNumber;
    } else if (route) {
      result.street = route;
    }
    
    console.log('Parsed result:', result);
    console.log('Street number:', streetNumber, 'Route:', route);
    
    return result;
  };
  const handleAddressSelect = (addressValue: string) => {
    const selectedAddress = addressSuggestions.find(
      (addr) => addr.value === addressValue,
    );
    if (selectedAddress) {
      setSelectedAddressValue(addressValue);
      setAddressSearchValue("");
      if (isGoogleLoaded) {
        getPlaceDetails(addressValue, [
          "address_components",
          "formatted_address",
        ]).then((place) => {
          if (!place) return;
          const c = parseAddressComponents(place.address_components);

          // Set the full street address (street number + route)
          if (c.street) {
            console.log('Setting street address to:', c.street);
            setValue(fieldNames.street, c.street, {
              shouldValidate: true,
              shouldTouch: true,
            });
          } else {
            // Fallback to the full formatted address if street parsing fails
            console.log('Street parsing failed, using formatted address:', place.formatted_address);
            setValue(fieldNames.street, place.formatted_address, {
              shouldValidate: true,
              shouldTouch: true,
            });
          }

          if (c.city) {
            setValue(fieldNames.city, c.city, {
              shouldValidate: true,
              shouldTouch: true,
            });
          }
          if (c.province) {
            setValue(fieldNames.province, c.province, {
              shouldValidate: true,
              shouldTouch: true,
            });
          }
          if (c.postalCode) {
            setValue(fieldNames.postalCode, c.postalCode, {
              shouldValidate: true,
              shouldTouch: true,
            });
          }

          // Trigger validation after all fields are set
          setTimeout(() => {
            trigger();
          }, 100);
        });
      } else {
        // Fallback if Google Places API is not loaded
        setValue(fieldNames.street, selectedAddress.label, {
          shouldValidate: true,
          shouldTouch: true,
        });
        // Trigger validation for fallback case too
        setTimeout(() => {
          trigger();
        }, 100);
      }
    }
    setAddressOpen(false);
  };
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAddressSearchValue(newValue);
    setValue(fieldNames.street, newValue, {
      shouldValidate: true,
      shouldTouch: true,
    });
    setAddressOpen(true);
    if (newValue.trim() && newValue.length >= 3) {
      debouncedAddressSearch(newValue);
    } else {
      setAddressSuggestions([]);
      setAddressOpen(false);
    }
  };
  const handleAddressFocus = () => {
    if (addressSearchValue.trim() || addressSuggestions.length > 0)
      setAddressOpen(true);
  };
  const handleAddressInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !addressOpen &&
      (addressSearchValue.trim() || addressSuggestions.length > 0)
    )
      setAddressOpen(true);
  };
  const handleAddressOpenChange = (newOpen: boolean) => {
    // Defer state change to end of tick to avoid layout thrash during select
    requestAnimationFrame(() => {
      setAddressOpen(newOpen);
      if (!newOpen) setAddressSearchValue("");
    });
  };

  return (
    <div className="space-y-4" onKeyDown={enterKeyHandler}>
      <div className="relative">
        <label className="block text-lg font-semibold text-foreground mb-2">
          {labels?.street ?? "Street Address"}
        </label>
        <Popover open={addressOpen} onOpenChange={handleAddressOpenChange}>
          <PopoverTrigger asChild>
            <div ref={addressTriggerRef} className="relative">
              <input
                ref={addressInputRef}
                name={fieldNames.street}
                value={(streetValue as string) || ""}
                onChange={handleAddressInputChange}
                onFocus={handleAddressFocus}
                onClick={handleAddressInputClick}
                onBlur={(e) => {
                  // Trigger validation on blur
                  setValue(fieldNames.street, e.target.value, {
                    shouldValidate: true,
                    shouldTouch: true,
                  });
                }}
                autoComplete="off"
                placeholder={
                  placeholders?.street ??
                  (searchMode === "clinic"
                    ? "Start typing your clinic name or address..."
                    : "Start typing your address...")
                }
                className={cn(
                  "w-full h-14 rounded-md border-1 border-input bg-white px-3 py-2 text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 cursor-text",
                  "pl-3 pr-10",
                )}
              />
              {addressLoading && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                </div>
              )}
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
              <ChevronsUpDown
                className={cn(
                  "absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600",
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
              if (
                e.target &&
                addressTriggerRef.current?.contains(e.target as Node)
              ) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <div className="max-h-80 overflow-y-auto">
              {addressSuggestions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 bg-white">
                  No addresses found.
                </div>
              ) : (
                addressSuggestions.map((address) => (
                  <button
                    key={address.value}
                    type="button"
                    onClick={() => handleAddressSelect(address.value)}
                    className={cn(
                      "w-full px-3 py-3 text-sm text-gray-800 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors text-left flex items-center justify-between border-none bg-white",
                      selectedAddressValue === address.value &&
                        "bg-blue-50 text-blue-600",
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {address.label}
                        </div>
                        {address.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {address.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 transition-opacity duration-200 flex-shrink-0 text-blue-500",
                        selectedAddressValue === address.value
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
        {/* Display error message for street address */}
        {errors[fieldNames.street] && (
          <p className="text-sm text-destructive mt-1">
            {(errors[fieldNames.street] as { message?: string })?.message}
          </p>
        )}
      </div>

      {/* Mobile Layout: Stacked vertically */}
      <div className="space-y-3 sm:hidden">
        <div className="relative">
          <FormInput
            name={fieldNames.city}
            type="text"
            label={labels?.city ?? "City"}
            placeholder={
              cityLoading
                ? "Detecting location..."
                : (placeholders?.city ?? "City")
            }
            onChange={handleCityChange}
          />
          {showCityDropdown && bcCities.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {bcCities.map((city) => (
                <button
                  key={city.value}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none cursor-pointer"
                  onClick={() => handleCitySelect(city)}
                >
                  <div className="font-medium">{city.label}</div>
                  {city.region && (
                    <div className="text-sm text-gray-500">{city.region}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormSelect
            name={fieldNames.province}
            label={labels?.province ?? "Prov"}
            placeholder="Prov"
            options={CANADIAN_PROVINCES}
          />
          <FormInput
            name={fieldNames.postalCode}
            type="text"
            label={labels?.postalCode ?? "Zip"}
            placeholder={placeholders?.postalCode ?? "V6B 1A1"}
            maxLength={7}
            onChange={handlePostalCodeChange}
          />
        </div>
      </div>

      {/* Desktop Layout: All in one row */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
        <div className="relative">
          <FormInput
            name={fieldNames.city}
            type="text"
            label={labels?.city ?? "City"}
            placeholder={
              cityLoading
                ? "Detecting location..."
                : (placeholders?.city ?? "City")
            }
            onChange={handleCityChange}
          />
          {showCityDropdown && bcCities.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {bcCities.map((city) => (
                <button
                  key={city.value}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none cursor-pointer"
                  onClick={() => handleCitySelect(city)}
                >
                  <div className="font-medium">{city.label}</div>
                  {city.region && (
                    <div className="text-sm text-gray-500">{city.region}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <FormSelect
          name={fieldNames.province}
          label={labels?.province ?? "Prov"}
          placeholder="Prov"
          options={CANADIAN_PROVINCES}
        />
        <FormInput
          name={fieldNames.postalCode}
          type="text"
          label={labels?.postalCode ?? "Zip"}
          placeholder={placeholders?.postalCode ?? "V6B 1A1"}
          maxLength={7}
          onChange={handlePostalCodeChange}
        />
      </div>

      {cityLoading && (
        <div className="text-sm text-blue-600">Detecting your location...</div>
      )}
      {cityError && <div className="text-sm text-red-600">{cityError}</div>}
    </div>
  );
}
