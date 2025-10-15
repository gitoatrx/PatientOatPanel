"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ClinicInfo } from '@/lib/types/api';
import { patientService } from '@/lib/services/patientService';

interface ClinicContextType {
  clinicInfo: ClinicInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

interface ClinicProviderProps {
  children: ReactNode;
}

// Cache clinic info to prevent multiple API calls
let clinicInfoCache: ClinicInfo | null = null;
let isFetching = false;
let fetchPromise: Promise<void> | null = null;

// Cache key for localStorage
const CLINIC_CACHE_KEY = 'clinic-info-cache';
const CACHE_EXPIRY_KEY = 'clinic-info-cache-expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load cache from localStorage on module load
const loadCacheFromStorage = (): ClinicInfo | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CLINIC_CACHE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (cached && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        return JSON.parse(cached);
      } else {
        // Cache expired, clear it
        localStorage.removeItem(CLINIC_CACHE_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
      }
    }
  } catch (error) {
    console.warn('Failed to load clinic cache from localStorage:', error);
  }
  
  return null;
};

// Save cache to localStorage
const saveCacheToStorage = (clinicInfo: ClinicInfo): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CLINIC_CACHE_KEY, JSON.stringify(clinicInfo));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  } catch (error) {
    console.warn('Failed to save clinic cache to localStorage:', error);
  }
};

// Initialize cache from localStorage
clinicInfoCache = loadCacheFromStorage();

export function ClinicProvider({ children }: ClinicProviderProps) {
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(clinicInfoCache);
  const [isLoading, setIsLoading] = useState(!clinicInfoCache);
  const [error, setError] = useState<string | null>(null);

  const fetchClinicInfo = async () => {
    // If already fetching, wait for the existing promise
    if (isFetching && fetchPromise) {
      await fetchPromise;
      return;
    }

    // If already cached, use cache
    if (clinicInfoCache) {
      setClinicInfo(clinicInfoCache);
      setIsLoading(false);
      return;
    }

    // Start fetching
    isFetching = true;
    setIsLoading(true);
    setError(null);

    fetchPromise = (async () => {
      try {
        const response = await patientService.getClinicInfo();
        
        if (response.success) {
          clinicInfoCache = response.clinic;
          setClinicInfo(response.clinic);
          saveCacheToStorage(response.clinic);
        } else {
          setError('Failed to fetch clinic information');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clinic information');
      } finally {
        setIsLoading(false);
        isFetching = false;
        fetchPromise = null;
      }
    })();

    await fetchPromise;
  };

  useEffect(() => {
    fetchClinicInfo();
  }, []);

  const refetch = async () => {
    // Clear cache and force refetch
    clinicInfoCache = null;
    isFetching = false;
    fetchPromise = null;
    
    // Clear localStorage cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CLINIC_CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
    }
    
    await fetchClinicInfo();
  };

  const value: ClinicContextType = {
    clinicInfo,
    isLoading,
    error,
    refetch,
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}
