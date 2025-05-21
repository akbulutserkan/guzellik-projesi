// src/lib/error-messages.ts
export const ERROR_MESSAGES = {
    auth: {
      notAuthorized: 'Bu işlem için yetkiniz bulunmamaktadır.',
      sessionExpired: 'Oturumunuz sona ermiştir, lütfen tekrar giriş yapın.',
      invalidCredentials: 'Geçersiz kullanıcı adı veya şifre.'
    },
    permissions: {
      viewDenied: 'Bu sayfayı görüntüleme yetkiniz yok.',
      editDenied: 'Düzenleme yetkiniz bulunmamaktadır.',
      deleteDenied: 'Silme yetkiniz bulunmamaktadır.'
    }
  }