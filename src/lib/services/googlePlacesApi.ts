import { BCCity, BC_CITIES } from "@/lib/constants/bc-cities";

interface GooglePlacesResponse {
  predictions: Array<{
    description: string;
    place_id: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>;
  status: string;
}

// Cache for API responses
const apiCache = new Map<string, { data: BCCity[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

class GooglePlacesAPI {
  private apiKey: string;
  private baseUrl = "https://maps.googleapis.com/maps/api/place";
  private abortControllers = new Map<string, AbortController>();

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";
  }

  async searchBCCities(query: string): Promise<BCCity[]> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return [];
    }

    // Check cache first
    const cached = apiCache.get(trimmedQuery.toLowerCase());
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Cancel previous request for this query if it exists
    const existingController = this.abortControllers.get(trimmedQuery);
    if (existingController) {
      existingController.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    this.abortControllers.set(trimmedQuery, abortController);

    try {
      const response = await fetch(
        `/api/places?query=${encodeURIComponent(trimmedQuery)}`,
        {
          signal: abortController.signal,
        },
      );

      // Remove the controller from the map
      this.abortControllers.delete(trimmedQuery);

      if (!response.ok) {
        return BC_CITIES;
      }

      const data: GooglePlacesResponse = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        return BC_CITIES;
      }

      // Filter for BC cities and format the response
      const bcCities = data.predictions
        .filter((prediction) => {
          const description = prediction.description.toLowerCase();
          return (
            description.includes("bc") ||
            description.includes("british columbia") ||
            this.isBCCity(prediction.structured_formatting.main_text)
          );
        })
        .map((prediction) => ({
          value: prediction.place_id,
          label: prediction.structured_formatting.main_text,
          placeId: prediction.place_id,
          region: this.extractRegion(
            prediction.structured_formatting.secondary_text,
          ),
        }));

      // Cache the results
      apiCache.set(trimmedQuery.toLowerCase(), {
        data: bcCities.length > 0 ? bcCities : [],
        timestamp: Date.now(),
      });

      return bcCities.length > 0 ? bcCities : [];
    } catch (error) {
      // Remove the controller from the map
      this.abortControllers.delete(trimmedQuery);

      // Only handle non-abort errors
      if (error instanceof Error && error.name !== "AbortError") {
        console.warn("Google Places API error:", error);
      }

      return BC_CITIES;
    }
  }

  // Method to cancel all ongoing requests
  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }

  // Method to clear cache
  clearCache(): void {
    apiCache.clear();
  }

  private isBCCity(cityName: string): boolean {
    // List of major BC cities for fallback filtering
    const bcCities = [
      "vancouver",
      "surrey",
      "burnaby",
      "richmond",
      "coquitlam",
      "kelowna",
      "kamloops",
      "nanaimo",
      "langley",
      "abbotsford",
      "chilliwack",
      "prince george",
      "vernon",
      "penticton",
      "campbell river",
      "victoria",
      "delta",
      "maple ridge",
      "white rock",
      "port coquitlam",
      "north vancouver",
      "west vancouver",
      "port moody",
      "pitt meadows",
      "new westminster",
      "courtenay",
      "comox",
      "duncan",
      "ladysmith",
      "parksville",
      "qualicum beach",
      "port alberni",
      "saanich",
      "west kelowna",
      "lake country",
      "peachland",
      "summerland",
      "oliver",
      "osoyoos",
      "mission",
      "hope",
      "agassiz",
      "harrison hot springs",
      "cranbrook",
      "trail",
      "castlegar",
      "nelson",
      "revelstoke",
      "salmon arm",
      "sicamous",
      "golden",
      "invermere",
      "kimberley",
      "fernie",
      "fort st john",
      "dawson creek",
      "fort nelson",
      "terrace",
      "prince rupert",
      "smithers",
      "hazelton",
      "houston",
      "burns lake",
      "williams lake",
      "quesnel",
      "100 mile house",
      "mackenzie",
      "chetwynd",
      "tumbler ridge",
    ];

    return bcCities.includes(cityName.toLowerCase());
  }

  private extractRegion(secondaryText: string): string {
    if (secondaryText.toLowerCase().includes("metro vancouver"))
      return "Metro Vancouver";
    if (secondaryText.toLowerCase().includes("vancouver island"))
      return "Vancouver Island";
    if (secondaryText.toLowerCase().includes("okanagan"))
      return "Okanagan Valley";
    if (secondaryText.toLowerCase().includes("fraser valley"))
      return "Fraser Valley";
    if (secondaryText.toLowerCase().includes("northern")) return "Northern BC";
    if (secondaryText.toLowerCase().includes("kootenay")) return "Kootenays";
    return "British Columbia";
  }
}

export const googlePlacesAPI = new GooglePlacesAPI();
export type { BCCity };
