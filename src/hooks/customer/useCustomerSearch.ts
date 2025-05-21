'use client';

import { useState, useCallback } from 'react';
import { searchCustomers as apiSearchCustomers } from '@/services/customerService';
import { Customer } from '@/types/customer';
import { useCustomerUI } from './useCustomerUI';

export interface UseCustomerSearchResult {
  searchResults: Customer[];
  isSearching: boolean;
  searchCustomers: (query: string) => Promise<void>;
}

/**
 * Müşteri arama hook'u
 */
export const useCustomerSearch = (): UseCustomerSearchResult => {
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { formatCustomer, showErrorToast } = useCustomerUI();
  
  /**
   * Müşteri araması yapar
   */
  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      
      // customerService'deki searchCustomers fonksiyonunu kullan
      const result = await apiSearchCustomers(query);
      
      if (!result.success) {
        throw new Error(result.error || 'Müşteri araması yapılırken bir hata oluştu');
      }
      
      // Görüntüleme için formatla - UI hook'unu kullan
      const formattedResults = result.data.map(customer => formatCustomer(customer));
      
      setSearchResults(formattedResults);
    } catch (err) {
      console.error('Müşteri arama hatası:', err);
      setSearchResults([]);
      
      const errorMessage = err instanceof Error ? err.message : 'Müşteri araması yapılırken bir hata oluştu';
      showErrorToast(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [formatCustomer, showErrorToast]);

  return {
    searchResults,
    isSearching,
    searchCustomers
  };
};
