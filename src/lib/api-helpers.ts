/**
 * MCP API'yi çağırmak için yardımcı işlev
 * @param toolName Çağrılacak araç adı
 * @param params Araca gönderilecek parametreler
 * @param options Seçenekler (showToast, customErrorMsg, vb.)
 * @returns API yanıtı
 */
export async function callMcpApi(toolName: string, params: any = {}, options: { showToast?: boolean; customErrorMsg?: string } = {}) {
  try {
    console.log(`[api-helpers] [DEBUG] MCP API çağrılıyor, toolName: ${toolName}, params:`, JSON.stringify(params, null, 2));
    
    const requestBody = {
      method: 'call_tool',
      params: {
        name: toolName,
        arguments: params
      }
    };
    
    console.log(`[api-helpers] [DEBUG] Request içeriği:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // API yanıtını json olarak çözümle
    const data = await response.json();
    
    console.log(`[api-helpers] [DEBUG] API yanıtı:`, {
      status: response.status,
      ok: response.ok,
      success: data.success,
      error: data.error || 'YOK',
      dataVar: data.data ? 'VAR' : 'YOK'
    });
    
    // Bir hata oluşursa istisna fırlat
    if (!response.ok) {
      console.error(`[api-helpers] [DEBUG] API yanıtı başarısız (status: ${response.status}):`, data.error || 'Hata detayı yok');
      throw new Error(data.error || 'API isteği başarısız oldu');
    }
    
    return data;
  } catch (error: any) {
    console.error(`[api-helpers] [DEBUG] MCP API çağrısı başarısız oldu (${toolName}):`, error);
    return {
      success: false,
      error: error.message || 'API isteği başarısız oldu'
    };
  }
}
