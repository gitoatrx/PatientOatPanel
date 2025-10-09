export interface OatrxPharmacyResponse {
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    manager_name: string | null;
    city: string;
    address: string;
    province: string;
    zip_code: string;
    phone: string;
    fax: string;
    email: string;
    lat: string;
    lng: string;
    active: number;
    logo: string;
    image: string;
    distance: number | null;
    premium: number;
  }>;
}

export interface OatrxPharmacy {
  id: number;
  name: string;
  manager_name: string | null;
  city: string;
  address: string;
  province: string;
  zip_code: string;
  phone: string;
  fax: string;
  email: string;
  lat: string;
  lng: string;
  active: number;
  logo: string;
  image: string;
  distance: number | null;
  premium: number;
}

export interface GeocodingResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

export class OatrxPharmacyService {
  private static readonly OATRX_BASE_URL = 'https://oatrx.ca/api';
  private static readonly GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

  /**
   * Geocode an address to get latitude and longitude
   */
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const params = new URLSearchParams({
        address: address,
        key: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''
      });

      const response = await fetch(`${this.GOOGLE_GEOCODING_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GeocodingResponse = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to geocode address:', error);
      return null;
    }
  }

  /**
   * Fetch pharmacies from OATRX API
   */
  static async fetchPharmacies(lat?: number, lng?: number, searchTerm?: string): Promise<OatrxPharmacy[]> {
    try {
      let url = `${this.OATRX_BASE_URL}/fetch-all-pharmacies`;
      const params = new URLSearchParams();
      
      // Add coordinates if provided
      if (lat !== undefined && lng !== undefined) {
        params.append('lat', lat.toString());
        params.append('long', lng.toString());
        // console.log('📍 Fetching pharmacies with location:', { lat, lng });
      } else {
        console.log('🌍 Fetching all pharmacies (no location)');
      }
      
      // Add search term if provided
      if (searchTerm && searchTerm.trim().length >= 2) {
        params.append('search', searchTerm.trim());
        console.log('🔍 Adding search term:', searchTerm);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // console.log('🏥 Making request to:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OatrxPharmacyResponse = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error('API returned unsuccessful status');
      }
    } catch (error) {
      console.error('Failed to fetch pharmacies from OATRX:', error);
      throw error;
    }
  }

  /**
   * Get pharmacies with geocoding from patient address
   */
  static async getPharmaciesFromAddress(
    address: string, 
    searchTerm?: string
  ): Promise<OatrxPharmacy[]> {
    try {
      // First geocode the address
      const coordinates = await this.geocodeAddress(address);
      
      let pharmacies: OatrxPharmacy[] = [];
      
      if (coordinates) {
        // Fetch pharmacies with coordinates for distance calculation
        pharmacies = await this.fetchPharmacies(coordinates.lat, coordinates.lng, searchTerm);
      } else {
        // Fallback to fetching all pharmacies without coordinates
        console.warn('Could not geocode address, fetching all pharmacies');
        pharmacies = await this.fetchPharmacies(undefined, undefined, searchTerm);
      }

      // Always sort by distance if available, then apply search filtering
      const sortedPharmacies = this.sortPharmaciesByDistance(pharmacies);
      
      // Apply search filtering with leniency if search term provided
      if (searchTerm && searchTerm.trim()) {
        return this.filterPharmacies(sortedPharmacies, searchTerm);
      }
      
      return sortedPharmacies;
    } catch (error) {
      console.error('Failed to get pharmacies from address:', error);
      throw error;
    }
  }

  /**
   * Filter pharmacies by search term with leniency
   */
  static filterPharmacies(pharmacies: OatrxPharmacy[], searchTerm: string): OatrxPharmacy[] {
    if (!searchTerm.trim()) {
      return pharmacies;
    }

    const term = searchTerm.toLowerCase().trim();
    
    // Create search variations for leniency
    const searchVariations = [
      term,
      term.replace(/\s+/g, ''), // Remove spaces
      term.replace(/[^a-zA-Z0-9]/g, ''), // Remove special characters
      term.split(' ').join(''), // Join words
      term.split(' ').map(word => word.charAt(0)).join(''), // First letters
    ];

    const filtered = pharmacies.filter(pharmacy => {
      const searchableText = [
        pharmacy.name || '',
        pharmacy.address || '',
        pharmacy.city || '',
        pharmacy.province || '',
        pharmacy.zip_code || '',
        pharmacy.manager_name || '',
        pharmacy.phone || '',
        pharmacy.fax || ''
      ].join(' ').toLowerCase();

      // Check if any search variation matches
      return searchVariations.some(variation => 
        searchableText.includes(variation) ||
        variation.includes(searchableText.split(' ')[0]) || // Partial word match
        searchableText.split(' ').some(word => word.startsWith(variation)) // Starts with
      );
    });

    // Sort by distance first, then by name
    return this.sortPharmaciesByDistance(filtered);
  }

  /**
   * Sort pharmacies by distance
   */
  static sortPharmaciesByDistance(pharmacies: OatrxPharmacy[]): OatrxPharmacy[] {
    return [...pharmacies].sort((a, b) => {
      // If both have distance, sort by distance
      if (a.distance !== null && a.distance !== undefined && b.distance !== null && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      // If only one has distance, prioritize it
      if (a.distance !== null && a.distance !== undefined && (b.distance === null || b.distance === undefined)) {
        return -1;
      }
      if ((a.distance === null || a.distance === undefined) && b.distance !== null && b.distance !== undefined) {
        return 1;
      }
      // If neither has distance, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }
}
