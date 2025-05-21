/**
 * API service functions for AppointmentDetailModal - MCP API ile entegre edilmiş
 */

// Save appointment notes - MCP API ile
export const saveAppointmentNotes = async (appointmentId: string, notes: string) => {
  try {
    console.log(`MCP API ile notlar kaydediliyor: ${appointmentId}`);
    
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'update-appointment-notes',
          arguments: {
            id: appointmentId,
            notes: notes
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Notlar kaydedilemedi');
    }

    return result.data;
  } catch (error) {
    console.error('Notlar kaydedilirken hata:', error);
    throw error;
  }
};

// Save appointment payment - MCP API ile
export const saveAppointmentPayment = async (appointmentId: string, paymentAmount: string, signal?: AbortSignal, paymentMethod: string = 'Nakit') => {
  try {
    console.log(`MCP API ile ödeme kaydediliyor: ${appointmentId}, miktar: ${paymentAmount}, yöntem: ${paymentMethod}`);
    
    // Ödeme yöntemini standartlaştırma
    let standardPaymentMethod = paymentMethod;
    
    // Ödeme yönteminin türkçe karakter uyumluluğunu sağla
    if (paymentMethod.toLowerCase().includes('nakit')) {
      standardPaymentMethod = 'Nakit';
    } else if (paymentMethod.toLowerCase().includes('kart') || paymentMethod.toLowerCase().includes('kredi')) {
      standardPaymentMethod = 'Kredi Kartı';
    } else if (paymentMethod.toLowerCase().includes('havale') || paymentMethod.toLowerCase().includes('eft')) {
      standardPaymentMethod = 'Havale/EFT';
    }
    
    // MCP API üzerinden işlemi gerçekleştir
    const controller = new AbortController();
    const mpcSignal = signal || controller.signal;
    
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'process-appointment-payment',
          arguments: { 
            id: appointmentId,
            amount: parseFloat(paymentAmount),
            paymentMethod: standardPaymentMethod
          }
        }
      }),
      signal: mpcSignal
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Ödeme kaydedilemedi');
    }

    return result.data;
  } catch (error) {
    console.error('Ödeme kaydedilirken hata:', error);
    throw error;
  }
};

// Mark appointment as No-Show - MCP API ile
export const markAppointmentAsNoShow = async (appointmentId: string) => {
  try {
    console.log(`MCP API ile randevu no-show olarak işaretleniyor: ${appointmentId}`);
    
    // MCP API ile randevu durumunu güncelle
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'update-appointment',
          arguments: { 
            id: appointmentId,
            status: 'NO_SHOW',
            attendance: 'NO_SHOW' 
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Randevu durumu güncellenemedi');
    }

    return result.data;
  } catch (error) {
    console.error('Randevu durumu güncellenirken hata:', error);
    throw error;
  }
};

// Update appointment attendance status - MCP API ile
export const updateAttendanceStatus = async (appointmentId: string, status: string) => {
  try {
    console.log(`MCP API ile katılım durumu güncelleniyor: ${appointmentId}, durum: ${status}`);
    
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'update-appointment-attendance',
          arguments: { 
            id: appointmentId, 
            status: status.toUpperCase() 
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Katılım durumu güncellenemedi');
    }

    return result.data;
  } catch (error) {
    console.error('Katılım durumu güncellenirken hata:', error);
    throw error;
  }
};

// Cancel appointment - MCP API ile
export const cancelAppointment = async (appointmentId: string) => {
  try {
    console.log(`MCP API ile randevu iptal ediliyor: ${appointmentId}`);
    
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'call_tool',
        params: {
          name: 'delete-appointment',
          arguments: { id: appointmentId }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Randevu iptal edilemedi');
    }

    return result.data;
  } catch (error) {
    console.error('Randevu iptal edilirken hata:', error);
    throw error;
  }
};

// Get latest appointment end time for a customer
export const getLatestAppointmentEndTime = (appointment: any, allAppointments: any[]) => {
  if (!appointment || !allAppointments || allAppointments.length === 0) {
    return appointment?.end || new Date().toISOString();
  }
  
  // Filtrele ve müşterinin randevularını al
  const customerAppointments = allAppointments.filter(apt => 
    apt.customerId === appointment.customerId
  );
  
  if (customerAppointments.length === 0) {
    return appointment.end;
  }
  
  // Tüm randevuları tarihe göre sırala
  const sortedAppointments = [...customerAppointments].sort((a, b) => {
    const dateA = new Date(a.end);
    const dateB = new Date(b.end);
    return dateA.getTime() - dateB.getTime();
  });
  
  // İlk randevunun bitiş zamanını bul
  const firstAppointment = sortedAppointments[0];
  const firstAppointmentEndTime = new Date(firstAppointment.end);
  const currentTime = new Date();
  
  // En son randevuyu bul (en geç tarihli bitiş zamanı)
  const latestAppointment = sortedAppointments[sortedAppointments.length - 1];
  
  // Eğer ilk randevu şu andan önce ise, müşterinin ilk randevusunda olduğunu varsayalım
  if (firstAppointmentEndTime < currentTime) {
    console.log(`Müşterinin son randevu bitiş zamanı: ${new Date(latestAppointment.end).toLocaleTimeString()}`);
    return latestAppointment.end;
  }
  
  // Eğer henüz ilk randevu başlamamışsa, ilk randevunun bitiş zamanını kullan
  console.log(`Müşterinin ilk randevu bitiş zamanı: ${firstAppointmentEndTime.toLocaleTimeString()}`);
  return firstAppointment.end;
};