'use client';

// Bu dosya tarayıcıda fetch isteklerini yakalar ve gerekirse yönlendirir
// Özellikle mcapi -> mcp dönüşümü için kullanılır

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
  
  // Düzeltilmiş URL ile orijinal fetch'i çağır
  return originalFetch(url, init);
};

export default function initFetchInterceptor() {
  console.log('Fetch interceptor etkinleştirildi');
  return null;
}
