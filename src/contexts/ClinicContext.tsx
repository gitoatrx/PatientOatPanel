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

export function ClinicProvider({ children }: ClinicProviderProps) {
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClinicInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await patientService.getClinicInfo();
      
      if (response.success) {
        setClinicInfo(response.clinic);
      } else {
        setError('Failed to fetch clinic information');
        // Set fallback clinic info
        setClinicInfo({
          id: 4,
          name: '123 Walkin Clinic',
          email: 'info@123walkinclinic.com',
          phone: '604-755-4408',
          address: '2777 Gladwin Road #108',
          city: 'Abbotsford',
          province: 'BC',
          postal_code: 'V2T 4V1',
          country: 'Canada',
          logo: 'https://cloud.oatrx.ca/storage/clinic_logos/123-walkin-clinic-abbotsford-logo.jpg',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clinic information');
      // Set fallback clinic info
      setClinicInfo({
        id: 4,
        name: '123 Walkin Clinic',
        email: 'info@123walkinclinic.com',
        phone: '604-755-4408',
        address: '2777 Gladwin Road #108',
        city: 'Abbotsford',
        province: 'BC',
        postal_code: 'V2T 4V1',
        country: 'Canada',
        logo: 'https://cloud.oatrx.ca/storage/clinic_logos/123-walkin-clinic-abbotsford-logo.jpg',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicInfo();
  }, []);

  const refetch = async () => {
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
