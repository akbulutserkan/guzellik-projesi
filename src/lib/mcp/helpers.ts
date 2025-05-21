'use client';

import { callMcpApi as apiHelperCallMcpApi } from '@/lib/api-helpers';

/**
 * MCP API'yi çağırmak için yardımcı işlev
 * @param toolName Çağrılacak araç adı
 * @param params Araca gönderilecek parametreler
 * @param options Seçenekler (showToast, customErrorMsg, vb.)
 * @returns API yanıtı
 */
export async function callMcpApi(toolName: string, params: any = {}, options: { showToast?: boolean; customErrorMsg?: string } = {}) {
  return await apiHelperCallMcpApi(toolName, params, options);
}
