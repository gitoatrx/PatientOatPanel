"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Phone, Clock, Star, Truck, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OatrxPharmacyService, OatrxPharmacy } from '@/lib/services/oatrxPharmacyService';
import type { WizardForm } from '@/types/wizard';

interface PharmacyStepProps {
  formValues: WizardForm;
}

type PharmacyOption = 'delivery' | 'pickup';

export function PharmacyStep({ formValues }: PharmacyStepProps) {
  const [pharmacyOption, setPharmacyOption] = useState<PharmacyOption>('delivery');
  const [pharmacies, setPharmacies] = useState<OatrxPharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<OatrxPharmacy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Build address from form values
  const buildAddress = () => {
    const parts = [
      formValues.streetAddress,
      formValues.city,
      formValues.province,
      formValues.postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch pharmacies only when pickup is selected or address changes (NOT on search term changes)
  useEffect(() => {
    const fetchPharmacies = async () => {
      if (pharmacyOption === 'pickup' && pharmacies.length === 0) {
        setIsLoading(true);
        setError(null);
        
        try {
          const address = buildAddress();
          if (!address) {
            setError('Address not found. Please complete your address information first.');
            return;
          }

          // Fetch ALL pharmacies without search term - we'll filter locally
          const fetchedPharmacies = await OatrxPharmacyService.getPharmaciesFromAddress(
            address
            // No searchTerm parameter - get all pharmacies
          );
          
          // Pharmacies are sorted by distance in the service
          setPharmacies(fetchedPharmacies);
        } catch (err) {
          console.error('Failed to fetch pharmacies:', err);
          setError('Failed to load pharmacies. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPharmacies();
  }, [pharmacyOption, formValues.streetAddress, formValues.city, formValues.province, formValues.postalCode]);

  // Save pharmacy data to localStorage when selections change
  React.useEffect(() => {
    const pharmacyData: Partial<WizardForm> = {
      pharmacyOption,
      selectedPharmacy: selectedPharmacy ? {
        id: selectedPharmacy.id,
        name: selectedPharmacy.name,
        address: selectedPharmacy.address,
        city: selectedPharmacy.city,
        province: selectedPharmacy.province,
        phone: selectedPharmacy.phone
      } : undefined
    };

    localStorage.setItem('pharmacy-data', JSON.stringify(pharmacyData));
  }, [pharmacyOption, selectedPharmacy]);

  // Apply intelligent local filtering for user-friendly search
  const filteredPharmacies = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return pharmacies;
    }
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    return pharmacies.filter(pharmacy => {
      // Normalize phone numbers by removing dashes, spaces, and parentheses for better matching
      const normalizedPhone = (pharmacy.phone || '').replace(/[-\(\)\s]/g, '');
      const normalizedSearchTerm = searchTermLower.replace(/[-\(\)\s]/g, '');
      
      // Check if search term matches phone number (exact match for phone)
      if (normalizedPhone && normalizedPhone.includes(normalizedSearchTerm)) {
        return true;
      }
      
      // For non-phone searches, split into words and check if ALL words are found
      const searchWords = searchTermLower.split(/\s+/).filter(word => word.length > 0);
      
      const searchableText = [
        pharmacy.name || '',
        pharmacy.address || '',
        pharmacy.city || '',
        pharmacy.province || '',
        pharmacy.zip_code || '',
        pharmacy.manager_name || ''
      ].join(' ').toLowerCase();
      
      // Check if ALL search words are found in the searchable text
      return searchWords.every(word => searchableText.includes(word));
    });
  }, [pharmacies, searchTerm]);


  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Pharmacy Options */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Card 
            className={`cursor-pointer transition-all duration-300 border-2 p-0 ${
              pharmacyOption === 'delivery' 
                ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/20' 
                : 'border-gray-200 hover:border-primary/30 hover:bg-gradient-to-br hover:from-gray-50 to-gray-100'
            }`}
            onClick={() => setPharmacyOption('delivery')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  pharmacyOption === 'delivery' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-gray-900">Delivery</h3>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card 
            className={`cursor-pointer transition-all duration-300 border-2 p-0 ${
              pharmacyOption === 'pickup' 
                ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/20' 
                : 'border-gray-200 hover:border-primary/30 hover:bg-gradient-to-br hover:from-gray-50 to-gray-100'
            }`}
            onClick={() => setPharmacyOption('pickup')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  pharmacyOption === 'pickup' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-gray-900">Pickup</h3>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pharmacy Selection (only for pickup) */}
      <AnimatePresence>
        {pharmacyOption === 'pickup' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Search Section */}
            <div className="bg-gray-50 p-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900">Find Nearby Pharmacies</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by pharmacy name, address, or city..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-12 h-12 text-base border border-gray-300 focus:border-gray-400 rounded-lg focus:shadow-none focus-visible:ring-0"
                />
                {isLoading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
                  </div>
                )}
                
                {/* Pharmacy Suggestions Dropdown - positioned exactly within input field */}
                {showSuggestions && (
                  <div ref={suggestionsRef} className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                    {isLoading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Searching pharmacies...</p>
                      </div>
                    ) : filteredPharmacies.length === 0 ? (
                      <div className="p-4 text-center">
                        <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {searchTerm ? 'No pharmacies found' : 'Loading pharmacies...'}
                        </p>
                        {searchTerm && (
                          <p className="text-xs text-gray-500">Try a different search term</p>
                        )}
                      </div>
                    ) : (
                      <div className="py-0">
                        {filteredPharmacies.map((pharmacy, index) => (
                          <button
                            key={pharmacy.id}
                            onClick={() => {
                              setSelectedPharmacy(pharmacy);
                              setShowSuggestions(false);
                            }}
                            className={`w-full text-left px-2 py-2 hover:bg-gray-50 transition-colors ${
                              selectedPharmacy?.id === pharmacy.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 text-xs ">
                                  {pharmacy.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {pharmacy.address}, {pharmacy.city}, {pharmacy.province} {pharmacy.zip_code}
                                </div>
                              </div>
                              {pharmacy.distance !== null && (
                                <div className="ml-0 flex-shrink-0">
                                  
                                  <div className="text-xs font-medium text-blue-600">
                                  {pharmacy.distance.toFixed(1)} km
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pharmacy Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="text-sm font-medium text-red-800">Error</div>
                </div>
                <div className="text-sm text-red-700 mt-1">{error}</div>
              </div>
            )}




            {/* Selected Pharmacy Summary - Only show when user selects a pharmacy */}
            {selectedPharmacy && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4"
              >
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">Selected Pharmacy</div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-blue-900">{selectedPharmacy.name}</div>
                    <div className="text-xs text-blue-700 mt-1">
                      {selectedPharmacy.address && `${selectedPharmacy.address}, `}
                      {selectedPharmacy.city}, {selectedPharmacy.province}
                    </div>
                  </div>
                  {selectedPharmacy.distance !== null && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {selectedPharmacy.distance.toFixed(1)} km
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
