'use client';

import { callMcpApi } from './helpers';

/**
 * MCP API üzerinden tüm hizmetleri getir
 */
export async function fetchServicesMcp(options: { includeDeleted?: boolean } = {}) {
  try {
    const result = await callMcpApi('get-services', options, {
      showToast: false,
      customErrorMsg: 'Hizmet listesi alınırken bir hata oluştu'
    });
    
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Hizmet verileri alınırken hata:', error);
    return [];
  }
}
