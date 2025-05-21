'use client'

// hooks/utility/useIsMobile.ts
import { useState, useEffect } from 'react';

/**
 * Ekranın mobil boyutta olup olmadığını kontrol eden hook
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};
