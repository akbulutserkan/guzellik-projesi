'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Yenilenebilir veri kaynağı hook'u.
 * Sadece manuel refresh çağrıldığında veri çeker.
 */
export default function useRefreshableData<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadDone = useRef(false);
  
  // Veriyi yenileme fonksiyonu
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Veri yenileniyor...');
      const result = await fetchFunction();
      setData(result);
      initialLoadDone.current = true;
      return result;
    } catch (err) {
      console.error('Veri yenileme hatası:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);
  
  // Başlangıçta sadece bir kez veri yükle, bağımlılıklar değiştiğinde otomatik yenilemez
  useEffect(() => {
    // Eğer hiç veri yüklenmemişse, ilk yüklemeyi yap
    if (!initialLoadDone.current) {
      refresh();
    }
  }, [refresh]);
  
  return { data, loading, error, refresh };
}
