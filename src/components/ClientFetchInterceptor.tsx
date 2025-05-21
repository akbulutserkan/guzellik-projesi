'use client';

import { useEffect } from 'react';

export default function ClientFetchInterceptor() {
  useEffect(() => {
    // Orijinal fetch fonksiyonunu yedekle
    const originalFetch = window.fetch;

    // Yeni bir fetch fonksiyonu oluştur
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      let url = input.toString();
      
      // Eğer istek /api/mcapi'ye gidiyorsa, /api/mcp'ye yönlendir
      if (url.includes('/api/mcapi')) {
        console.log(`Fetch isteği düzeltiliyor: ${url} -> ${url.replace('/api/mcapi', '/api/mcp')}`);
        url = url.replace('/api/mcapi', '/api/mcp');
      }
      
      console.log(`[FETCH DEBUG] İstek yapılıyor: ${url}`);
      console.log(`[FETCH DEBUG] İstek metodu: ${init?.method || 'GET'}`);
      
      if (init?.body) {
        try {
          const bodyContent = JSON.parse(init.body as string);
          console.log(`[FETCH DEBUG] İstek gövdesi:`, bodyContent);
        } catch (e) {
          console.log(`[FETCH DEBUG] İstek gövdesi (metin):`, init.body);
        }
      }
      
      // Düzeltilmiş URL ile orijinal fetch'i çağır
      try {
        const response = await originalFetch(url, init);
        
        // Response log'u
        console.log(`[FETCH DEBUG] ${url} için yanıt durumu: ${response.status}`);
        
        // Response kopyasını oluştur (orijinal response'u klonla)
        const responseClone = response.clone();
        
        try {
          const responseData = await responseClone.json();
          console.log(`[FETCH DEBUG] Yanıt içeriği:`, responseData);
        } catch (e) {
          console.log(`[FETCH DEBUG] Yanıt JSON olarak ayrıştırılamadı`);
        }
        
        return response;
      } catch (error) {
        console.error(`[FETCH DEBUG] İstek hatası:`, error);
        throw error;
      }
    };

    console.log('Fetch interceptor etkinleştirildi');

    // Cleanup function
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
