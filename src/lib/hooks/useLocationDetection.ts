import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { googlePlacesAPI, BCCity } from "@/lib/services/googlePlacesApi";
import { searchBCCities as searchStaticCities } from "@/lib/constants/bc-cities";

interface LocationState {
  city: string;
  cityLoading: boolean;
  cityError: string;
  showLocationPopup: boolean;
  bcCities: BCCity[];
  showCityDropdown: boolean;
  citySearchLoading: boolean; // Add this new state
}

interface UseLocationDetectionReturn extends LocationState {
  detectLocation: () => Promise<void>;
  handleEnableLocation: () => Promise<void>;
  setCity: (city: string) => void;
  setShowLocationPopup: (show: boolean) => void;
  cityInputRef: React.RefObject<HTMLInputElement | null>;
  searchBCCities: (query: string) => Promise<void>;
  selectCity: (city: BCCity) => void;
  setShowCityDropdown: (show: boolean) => void;
  setBcCities: (cities: BCCity[]) => void;
}

// Interface for Nominatim response data
interface NominatimResponse {
  name?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    locality?: string;
    state_district?: string;
    county?: string;
    state?: string;
  };
}

// Function to extract city name from Nominatim response
const extractCityName = (data: NominatimResponse | null): string => {
  if (!data) return "Unknown location";

  // First try the name field (most specific location name)
  if (data.name) {
    return data.name;
  }

  // Try address components next
  if (data.address) {
    const address = data.address;
    return (
      address.city ||
      address.town ||
      address.village ||
      address.locality ||
      address.state_district ||
      address.county ||
      address.state ||
      "Unknown location"
    );
  }

  // Fallback to display_name
  if (data.display_name) {
    const parts = data.display_name.split(",");
    return parts[0]?.trim() || "Unknown location";
  }

  return "Unknown location";
};

// Global cache for API responses to avoid redundant calls
const apiCache = new Map<string, { data: BCCity[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global state to prevent duplicate location detection calls
let globalLocationDetectionPromise: Promise<string> | null = null;
let globalDetectedCity: string | null = null;
let globalDetectionInProgress = false;
let globalDetectionTimestamp = 0;
const LOCATION_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache for location

// Debounce utility
const createDebounce = (delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (callback: () => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

export const useLocationDetection = (): UseLocationDetectionReturn => {
  const [city, setCity] = useState("");
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState("");
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [bcCities, setBcCities] = useState<BCCity[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchLoading, setCitySearchLoading] = useState(false); // Add this state
  const cityInputRef = useRef<HTMLInputElement | null>(null);

  // Refs for tracking state
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Create debounced search function
  const debouncedSearch = useMemo(() => createDebounce(300), []);

  // Function to get cached results
  const getCachedResults = useCallback((query: string): BCCity[] | null => {
    const cached = apiCache.get(query.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  // Function to cache results
  const cacheResults = useCallback((query: string, results: BCCity[]) => {
    apiCache.set(query.toLowerCase(), {
      data: results,
      timestamp: Date.now(),
    });
  }, []);

  // Function to search BC cities with debouncing and caching
  const searchBCCities = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        setBcCities([]);
        setShowCityDropdown(false);
        setCitySearchLoading(false); // Reset loading state
        return;
      }

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      lastQueryRef.current = trimmedQuery;

      // Check cache first
      const cachedResults = getCachedResults(trimmedQuery);
      if (cachedResults) {
        setBcCities(cachedResults);
        setShowCityDropdown(cachedResults.length > 0);
        setCitySearchLoading(false); // Reset loading state
        return;
      }

      // Set loading state for new search
      setCitySearchLoading(true);

      // Debounce the API call
      debouncedSearch(async () => {
        // Check if this is still the current query
        if (lastQueryRef.current !== trimmedQuery) {
          return;
        }

        try {
          // Try Google Places API first
          const apiCities = await googlePlacesAPI.searchBCCities(trimmedQuery);

          // Check if this is still the current query after API call
          if (lastQueryRef.current !== trimmedQuery) {
            return;
          }

          if (apiCities && apiCities.length > 0) {
            // Remove duplicates by using a Map with label as key
            const uniqueCities = Array.from(
              new Map(apiCities.map((city) => [city.label, city])).values(),
            );
            setBcCities(uniqueCities);
            setShowCityDropdown(true);
            cacheResults(trimmedQuery, uniqueCities);
          } else {
            // No results from API, try static search
            const staticCities = searchStaticCities(trimmedQuery);
            setBcCities(staticCities);
            setShowCityDropdown(staticCities.length > 0);
            cacheResults(trimmedQuery, staticCities);
          }
        } catch (error) {
          // Check if this is still the current query
          if (lastQueryRef.current !== trimmedQuery) {
            return;
          }

          // Only handle errors if it's not an abort error
          if (error instanceof Error && error.name !== "AbortError") {
            console.warn(
              "Google Places API error, falling back to static search:",
              error,
            );
            const staticCities = searchStaticCities(trimmedQuery);
            setBcCities(staticCities);
            setShowCityDropdown(staticCities.length > 0);
            cacheResults(trimmedQuery, staticCities);
          }
        } finally {
          // Always reset loading state
          setCitySearchLoading(false);
        }
      });
    },
    [debouncedSearch, getCachedResults, cacheResults],
  );

  // Function to select a city from dropdown
  const selectCity = useCallback((selectedCity: BCCity) => {
    // Don't select placeholder or not-found messages
    if (
      selectedCity.label === "Please type your city" ||
      selectedCity.label === "No cities found"
    ) {
      return;
    }

    setCity(selectedCity.label);
    setShowCityDropdown(false);
    setBcCities([]);
    if (cityInputRef.current) {
      cityInputRef.current.blur();
    }
  }, []);

  // Global location detection function to prevent duplicate calls
  const performLocationDetection = useCallback(async (): Promise<string> => {
    // Check if we have a valid cached location
    const now = Date.now();
    if (
      globalDetectedCity &&
      now - globalDetectionTimestamp < LOCATION_CACHE_DURATION
    ) {
      return globalDetectedCity;
    }

    // Check if there's already a detection in progress
    if (globalLocationDetectionPromise) {
      return globalLocationDetectionPromise;
    }

    // Start new detection
    globalDetectionInProgress = true;
    globalLocationDetectionPromise = new Promise<string>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=10`,
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const cityName = extractCityName(data);

            // Cache the result
            globalDetectedCity = cityName;
            globalDetectionTimestamp = Date.now();

            resolve(cityName);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          reject(error);
        },
      );
    });

    try {
      const result = await globalLocationDetectionPromise;
      return result;
    } finally {
      globalLocationDetectionPromise = null;
      globalDetectionInProgress = false;
    }
  }, []);

  // Optimized location detection with caching
  const detectLocation = useCallback(async (): Promise<void> => {
    setCityError("");
    setCityLoading(true);
    setShowLocationPopup(false);

    if (!navigator.geolocation) {
      setCityError("Geolocation not supported");
      setCityLoading(false);
      return;
    }

    // Cancel any ongoing API requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      const cityName = await performLocationDetection();
      if (mountedRef.current) {
        setCity(cityName);
      }
    } catch (error) {
      if (mountedRef.current) {
        if (error instanceof Error) {
          if (error.message.includes("PERMISSION_DENIED")) {
            setShowLocationPopup(true);
          } else {
            console.error("Failed to determine city from coordinates:", error);
            setCityError("Could not determine city");
          }
        }
      }
    } finally {
      if (mountedRef.current) {
        if (cityInputRef.current) cityInputRef.current.blur();
        setCityLoading(false);
      }
    }
  }, [performLocationDetection]);

  // Function to handle manual location enable attempt
  const handleEnableLocation = useCallback(async (): Promise<void> => {
    setShowLocationPopup(false);
    setCityLoading(true);

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      const cityName = await performLocationDetection();
      if (mountedRef.current) {
        setCity(cityName);
      }
    } catch (error) {
      if (mountedRef.current) {
        if (error instanceof Error) {
          if (error.message.includes("PERMISSION_DENIED")) {
            setCityError(
              "Location access denied. Please enable location in browser settings.",
            );
          } else {
            console.error("Failed to determine city from coordinates:", error);
            setCityError("Could not determine city");
          }
        }
      }
    } finally {
      if (mountedRef.current) {
        if (cityInputRef.current) cityInputRef.current.blur();
        setCityLoading(false);
      }
    }
  }, [performLocationDetection]);

  // Auto-detect location on mount with optimized timing - only for the first component
  useEffect(() => {
    // Only trigger auto-detection if no detection is in progress and no cached city
    if (!globalDetectionInProgress && !globalDetectedCity) {
      const timer = setTimeout(() => {
        if (navigator.geolocation && mountedRef.current) {
          setCityLoading(true);
          performLocationDetection()
            .then((cityName) => {
              if (mountedRef.current) {
                setCity(cityName);
              }
            })
            .catch((error) => {
              if (mountedRef.current) {
                console.debug("Auto-detection failed silently:", error);
              }
            })
            .finally(() => {
              if (mountedRef.current) {
                setCityLoading(false);
              }
            });
        }
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    } else if (globalDetectedCity && mountedRef.current) {
      // Use cached city if available
      setCity(globalDetectedCity);
    }
  }, [performLocationDetection]);

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    city,
    cityLoading,
    cityError,
    showLocationPopup,
    bcCities,
    showCityDropdown,
    citySearchLoading, // Add this to the return object
    detectLocation,
    handleEnableLocation,
    setCity,
    setShowLocationPopup,
    cityInputRef,
    searchBCCities,
    selectCity,
    setShowCityDropdown,
    setBcCities,
  };
};
