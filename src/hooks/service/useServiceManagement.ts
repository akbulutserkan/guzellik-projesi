/**
 * Hizmet yönetimi ana hook'u - Bütün alt hook'ları birleştiren
 */
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';

// Alt hook'lar - Single Responsibility Principle'a uygun
import useServiceData, { Service, ServiceFilterOptions } from './useServiceData';
import useServiceCategory, { ServiceCategory } from './useServiceCategory';
import useServiceUI from './useServiceUI';
import useServicePermissions from './useServicePermissions';
import useServiceCache from './useServiceCache';
import useServiceStatus from './useServiceStatus';

interface UseServiceManagementProps {
  initialServices?: Service[];
  initialCategories?: ServiceCategory[];
  autoFetch?: boolean;
  showToasts?: boolean;
}

/**
 * Hizmet yönetimi ana hook'u
 */
export const useServiceManagement = ({
  initialServices = [],
  initialCategories = [],
  autoFetch = true,
  showToasts = true
}: UseServiceManagementProps = {}) => {
  
  // State yönetimi ve CRUD işlemleri
  const serviceData = useServiceData({
    initialServices,
    autoFetch,
    showToasts
  });
  
  // Kategori yönetimi
  const serviceCategory = useServiceCategory({
    initialCategories,
    autoFetch,
    showToasts
  });
  
  // UI durumlarının yönetimi
  const serviceUI = useServiceUI();
  
  // İzin kontrolü
  const permissions = useServicePermissions();
  
  // Admin kontrolü ek güvenlik için
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  
  // Eğer admin ise, izinleri manuel olarak override edelim
  if (isAdmin) {
    console.log("useServiceManagement - Admin kullanıcı tespit edildi, izinler override ediliyor");
    // canView özelliğini direkt güncelleyelim
    // @ts-ignore - permissions üzerinde düzenleme yapmamız gerekiyor
    permissions.canView = true;
    permissions.canViewServices = true;
    permissions.canAddService = true;
    permissions.canEditService = true;
    permissions.canDeleteService = true;
    permissions.canAddServiceCategory = true;
    permissions.canEditServiceCategory = true;
    permissions.canDeleteServiceCategory = true;
    permissions.canManageServiceCategories = true;
    
    // Sayfa içindeki buton kontrolleri için kullanılan property'ler
    permissions.canAdd = true;
    permissions.canEdit = true;
    permissions.canDelete = true;
    
    console.log("Admin izinleri güncellendi:", permissions);
  }
  
  // Önbellek yönetimi
  const serviceCache = useServiceCache();
  
  // Durum ve istatistik yönetimi
  const serviceStatus = useServiceStatus(
    serviceData.services,
    serviceCategory.categories
  );
  
  // İlk yükleme ve otomatik yenileme
  useEffect(() => {
    if (autoFetch) {
      Promise.all([
        serviceCategory.fetchCategories(),
        serviceData.fetchServices()
      ]);
    }
    
    // Belirli aralıklarla değişiklikleri sessizce kontrol et
    const intervalId = setInterval(() => {
      serviceCache.silentRefresh(
        serviceData.lastOperationTime,
        serviceData.fetchServices,
        serviceCategory.fetchCategories
      );
    }, serviceCache.refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [
    autoFetch, 
    serviceData.fetchServices, 
    serviceCategory.fetchCategories,
    serviceCache.silentRefresh,
    serviceCache.refreshInterval,
    serviceData.lastOperationTime
  ]);
  
  // Kategoriler değiştiğinde servisleri güncelleme
  useEffect(() => {
    // Servislerin kategorilerini güncelleyelim
    if (serviceCategory.categories.length > 0 && serviceData.services.length > 0) {
      const updatedServices = serviceCache.mergeServicesWithCategories(
        serviceData.services,
        serviceCategory.categories
      );
      
      // Çok sık gereksiz render olmaması için JSON.stringify ile karşılaştır
      if (JSON.stringify(updatedServices) !== JSON.stringify(serviceData.services)) {
        // Bu sadece servisleri günceller, setServices doğrudan çağrılmamalı
        // serviceData.setServices geçersiz bir operasyon
        // Bunun yerine fetchServices çağrılıp, services yeniden elde edilmeli
        serviceData.fetchServices();
      }
    }
  }, [serviceCategory.categories, serviceData.services, serviceCache.mergeServicesWithCategories]);
  
  // Seçili servis detayı değiştiğinde form verilerini güncelleme
  useEffect(() => {
    if (serviceUI.selectedServiceForEdit) {
      serviceData.setServiceFormData({
        name: serviceUI.selectedServiceForEdit.name || '',
        description: serviceUI.selectedServiceForEdit.description || '',
        price: serviceUI.selectedServiceForEdit.price || 0,
        duration: serviceUI.selectedServiceForEdit.duration || 30,
        categoryId: serviceUI.selectedServiceForEdit.categoryId || '',
        isActive: serviceUI.selectedServiceForEdit.isActive !== undefined 
          ? serviceUI.selectedServiceForEdit.isActive 
          : true
      });
    }
  }, [serviceUI.selectedServiceForEdit]);
  
  // Oluşturma işleyicisi
  const handleCreateService = async () => {
    try {
      const newService = await serviceData.createService();
      if (newService) {
        // Yerel state'i güncelleyelim
        // Direkt setServices çağırmak yerine fetchServices kullanalım
        serviceData.fetchServices();
        serviceUI.closeCreateModal();
        
        // Form verilerini sıfırlayalım
        serviceData.setServiceFormData({
          name: '',
          description: '',
          price: 0,
          duration: 30,
          categoryId: '',
          isActive: true
        });
      }
      return newService;
    } catch (error) {
      console.error('Hizmet oluşturma hatası:', error);
      return null;
    }
  };
  
  // Güncelleme işleyicisi
  const handleUpdateService = async (serviceId?: string) => {
    // Eğer serviceId parametresi verilmişse onu kullan, yoksa seçili hizmeti kullan
    const targetServiceId = serviceId || (serviceUI.selectedServiceForEdit ? serviceUI.selectedServiceForEdit.id : null);
    
    if (!targetServiceId) return null;
    
    try {
      const updatedService = await serviceData.updateService(
        targetServiceId,
        serviceData.serviceFormData
      );
      
      if (updatedService) {
        // Yerel state'i güncelleyelim
        // Direkt setServices çağırmak yerine fetchServices kullanalım
        serviceData.fetchServices();
        serviceUI.closeEditModal();
      }
      
      return updatedService;
    } catch (error) {
      console.error('Hizmet güncelleme hatası:', error);
      return null;
    }
  };
  
  // Silme işleyicisi
  const handleDeleteService = async (serviceId?: string) => {
    // Eğer serviceId parametresi verilmişse onu kullan, yoksa seçili hizmeti kullan
    const targetServiceId = serviceId || (serviceUI.selectedServiceForDelete ? serviceUI.selectedServiceForDelete.id : null);
    
    if (!targetServiceId) {
      console.error('[SİLME-DETAY] useServiceManagement - handleDeleteService: ServiceId bulunamadı!');
      return false;
    }
    
    console.log(`[SİLME-DETAY] useServiceManagement - handleDeleteService: Silme başladı, serviceId: ${targetServiceId}`);
    
    try {
      const success = await serviceData.deleteService(targetServiceId);
      
      console.log(`[SİLME-DETAY] useServiceManagement - handleDeleteService: Silme sonucu: ${success ? 'Başarılı' : 'Başarısız'}`);
      
      if (success) {
        // Yerel state'i güncelleyelim
        // Direkt setServices çağırmak yerine fetchServices kullanalım
        serviceData.fetchServices();
        serviceUI.closeDeleteModal();
      }
      
      return success;
    } catch (error) {
      console.error('[SİLME-DETAY] useServiceManagement - handleDeleteService: Hata yakalandı:', error);
      return false;
    }
  };
  
  // Kategori oluşturma işleyicisi
  const handleCreateCategory = async () => {
    try {
      const newCategory = await serviceCategory.createCategory();
      if (newCategory) {
        serviceUI.closeCategoryModal();
      }
      return newCategory;
    } catch (error) {
      console.error('Kategori oluşturma hatası:', error);
      return null;
    }
  };
  
  // Birleştirilmiş loading state
  const loading = useMemo(() => 
    serviceData.loading || serviceCategory.loading,
    [serviceData.loading, serviceCategory.loading]
  );
  
  // Birleştirilmiş error state
  const error = useMemo(() => 
    serviceData.error || serviceCategory.error,
    [serviceData.error, serviceCategory.error]
  );
  
  return {
    // State
    services: serviceData.services,
    categories: serviceCategory.categories,
    selectedService: serviceData.selectedService,
    loading,
    error,
    filters: serviceData.filters,
    serviceFormData: serviceData.serviceFormData,
    categoryFormData: serviceCategory.categoryFormData,
    
    // UI Durumları
    ...serviceUI,
    
    // Hesaplanan değerler
    ...serviceStatus,
    
    // Veri çekme
    fetchServices: serviceData.fetchServices,
    fetchCategories: serviceCategory.fetchCategories,
    fetchServiceDetails: serviceData.fetchServiceDetails,
    silentRefresh: () => serviceCache.silentRefresh(
      serviceData.lastOperationTime,
      serviceData.fetchServices,
      serviceCategory.fetchCategories
    ),
    
    // Form işlemleri
    handleServiceFormChange: serviceData.handleServiceFormChange,
    handleCategoryFormChange: serviceCategory.handleCategoryFormChange,
    handleFilterChange: serviceData.handleFilterChange,
    
    // Hizmet işlemleri
    handleCreateService,
    handleUpdateService,
    handleDeleteService,
    toggleServiceStatus: serviceData.toggleServiceStatus,
    
    // Kategori işlemleri
    handleCreateCategory,
    handleUpdateCategory: serviceCategory.updateCategory,
    updateCategory: serviceCategory.updateCategory,
    deleteCategory: serviceCategory.deleteCategory,
    
    // Yetkilendirme
    permissions
  };
};

export default useServiceManagement;