"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface GoogleMaps {
  maps: {
    places: {
      AutocompleteService: new () => AutocompleteService;
      PlacesService: new (div: HTMLDivElement) => PlacesService;
      PlacesServiceStatus: { OK: string };
    };
  };
}

interface AutocompleteService {
  getPlacePredictions(
    request: {
      input: string;
      componentRestrictions?: { country: string };
      types?: string[];
    },
    callback: (predictions: PlacePrediction[] | null, status: string) => void,
  ): void;
}

interface PlacesService {
  getDetails(
    request: { placeId: string; fields: string[] },
    callback: (place: PlaceDetails | null, status: string) => void,
  ): void;
}

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text: string; secondary_text: string };
}

export interface PlaceDetails {
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address: string;
}

declare global {
  interface Window {
    google: GoogleMaps;
  }
}

export function useGooglePlacesAutocomplete() {
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteService = useRef<AutocompleteService | null>(null);
  const placesService = useRef<PlacesService | null>(null);

  useEffect(() => {
    const initialize = () => {
      try {
        if (
          window.google &&
          window.google.maps &&
          window.google.maps.places &&
          window.google.maps.places.AutocompleteService &&
          window.google.maps.places.PlacesService
        ) {
          autocompleteService.current =
            new window.google.maps.places.AutocompleteService();
          placesService.current = new window.google.maps.places.PlacesService(
            document.createElement("div"),
          );
          setIsLoaded(true);
        } else {
          setTimeout(initialize, 100);
        }
      } catch {
        setIsLoaded(false);
      }
    };

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]',
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(initialize, 200);
      script.onerror = () => setIsLoaded(false);
      document.head.appendChild(script);
    } else {
      setTimeout(initialize, 200);
    }

    return () => {
      autocompleteService.current = null;
      placesService.current = null;
    };
  }, []);

  const getPredictions = useCallback(
    (input: string, opts?: { country?: string; types?: string[] }) =>
      new Promise<PlacePrediction[]>((resolve) => {
        if (!isLoaded || !autocompleteService.current || !input.trim())
          return resolve([]);
        autocompleteService.current.getPlacePredictions(
          {
            input,
            componentRestrictions: opts?.country
              ? { country: opts.country }
              : undefined,
            types: opts?.types ?? ["address"],
          },
          (predictions, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions &&
              predictions.length
            ) {
              resolve(predictions);
            } else {
              resolve([]);
            }
          },
        );
      }),
    [isLoaded],
  );

  const getPlaceDetails = useCallback(
    (
      placeId: string,
      fields: string[] = ["address_components", "formatted_address"],
    ) =>
      new Promise<PlaceDetails | null>((resolve) => {
        if (!isLoaded || !placesService.current) return resolve(null);
        placesService.current.getDetails(
          { placeId, fields },
          (place, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              place
            )
              resolve(place);
            else resolve(null);
          },
        );
      }),
    [isLoaded],
  );

  return { isLoaded, getPredictions, getPlaceDetails };
}
