/**
 * Özel log fonksiyonları modülü
 * Randevu oluşturma ve diğer kritik API işlemlerini adım adım loglamak için özel araçlar
 */

const DEBUG_ENABLED = true;
const TRACE_ENABLED = true;

/**
 * Gelişmiş debug log fonksiyonu
 * @param {string} component - Log kaynağı (bileşen/modül adı)
 * @param {string} message - Log mesajı
 * @param {any} data - İsteğe bağlı veri
 */
export function debugLog(component, message, data = null) {
  if (!DEBUG_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [DEBUG] [${component}]`;
  
  if (data) {
    try {
      const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      console.log(`${logPrefix} ${message}:\n`, dataStr);
    } catch (e) {
      console.log(`${logPrefix} ${message} (veri gösterilemiyor - ${e.message})`);
    }
  } else {
    console.log(`${logPrefix} ${message}`);
  }
}

/**
 * İzleme seviyesi log fonksiyonu - süreç akışını takip için
 */
export function traceLog(component, step, data = null) {
  if (!TRACE_ENABLED) return;
  
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [TRACE] [${component}] Adım ${step}`);
  
  if (data) {
    try {
      const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      console.log(`  Veri: ${dataStr}`);
    } catch (e) {
      console.log(`  Veri gösterilemiyor - ${e.message}`);
    }
  }
}

/**
 * Hata log fonksiyonu
 */
export function errorLog(component, message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] [${component}] ${message}:`);
  
  if (error) {
    console.error(`  Hata: ${error.message}`);
    console.error(`  Stack: ${error.stack}`);
    
    if (error.cause) {
      console.error(`  Neden: ${error.cause}`);
    }
    
    // Prisma hata yapısını kontrol et
    if (error.code && error.meta) {
      console.error(`  Prisma Hata Kodu: ${error.code}`);
      console.error(`  Prisma Meta:`, error.meta);
    }
  }
}

/**
 * Performans ölçme başlatma
 */
export function startPerf(component, operationName) {
  const timestamp = Date.now();
  return { component, operationName, startTime: timestamp };
}

/**
 * Performans ölçme sonlandırma
 */
export function endPerf(perfData) {
  const endTime = Date.now();
  const duration = endTime - perfData.startTime;
  
  console.log(`[PERF] [${perfData.component}] ${perfData.operationName} işlemi ${duration}ms sürdü`);
  return duration;
}
