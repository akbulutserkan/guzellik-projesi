"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useServiceManagement } from '@/hooks/service';
import { createService } from '@/services/serviceService';
import { createServiceCategory } from '@/services/serviceCategoryService';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogWithoutPrevent, DialogWithoutPreventContent, DialogWithoutPreventTitle } from '@/components/ui/dialog-without-prevent';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Label } from '@/components/ui/label';
import EditServiceModal from '@/components/Services/EditServiceModal';
import DeleteServiceModal from '@/components/Services/DeleteServiceModal';
import EditCategoryModal from '@/components/Services/EditCategoryModal';
import DeleteCategoryModal from '@/components/Services/DeleteCategoryModal';
import EmptyServiceState from '@/components/Services/EmptyServiceState';

export default function ServicesPage() {
  // State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [newServices, setNewServices] = useState<{[key: string]: {name: string; duration: string; price: string; categoryId?: string}}>({});
  const inputRefs = useRef<{[key: string]: HTMLInputElement}>({});
  
  // Güncelleme tetikleyici
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // Modal state
  const [editServiceModal, setEditServiceModal] = useState({ isOpen: false, serviceId: '' });
  const [deleteServiceModal, setDeleteServiceModal] = useState({ isOpen: false, serviceId: '', serviceName: '' });
  const [editCategoryModal, setEditCategoryModal] = useState({ isOpen: false, categoryId: '', categoryName: '' });
  const [deleteCategoryModal, setDeleteCategoryModal] = useState({ isOpen: false, categoryId: '', categoryName: '', serviceCount: 0 });
  const [newCategoryModal, setNewCategoryModal] = useState({ isOpen: false });
  const [newServiceModal, setNewServiceModal] = useState({ isOpen: false });
  
  // Servis hook'unu kullan
  const {
    services,
    categories,
    loading,
    permissions,
    fetchCategories,
    fetchServices,
    handleCreateCategory,
    handleCreateService,
    serviceFormData,
    handleServiceFormChange,
    handleCategoryFormChange
  } = useServiceManagement();
  
  const { toast } = useToast();
  
  // İlk yükleme
  useEffect(() => {
    console.log('Hizmetler sayfası güncelleniyor. Güncelleme Counter:', updateCounter);
    fetchCategories();
    fetchServices();
  }, [fetchCategories, fetchServices, updateCounter]);
  
  // Yeni kategori ekleme işlemi
  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori adı boş olamaz"
      });
      return;
    }
    
    try {
      console.log("Kategori ekleme işlemi başladı, isim:", newCategoryName);
      const result = await createServiceCategory({ name: newCategoryName });
      console.log("Kategori oluşturma sonuç:", result);
      await fetchCategories();
      setNewCategoryName('');
      if (result) {
        toast({
          title: "Başarılı",
          description: "Kategori başarıyla eklendi"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Kategori eklenemedi" 
        });
      }
    } catch (error) {
      console.error("Kategori ekleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori eklenirken bir hata oluştu"
      });
    }
  }, [newCategoryName, toast, fetchCategories]);
  
  // Kategori başlığına tıklama
  const toggleCategory = useCallback((categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(prev => prev.filter(id => id !== categoryId));
    } else {
      setExpandedCategories(prev => [...prev, categoryId]);
      if (!newServices[categoryId]) {
        setNewServices(prev => ({
          ...prev,
          [categoryId]: { name: '', duration: '', price: '' }
        }));
      }
      setTimeout(() => {
        if (inputRefs.current[categoryId]) {
          inputRefs.current[categoryId].focus();
        }
      }, 100);
    }
  }, [expandedCategories, newServices]);
  
  // Yeni hizmet ekleme
  const handleAddService = useCallback(async (categoryId: string) => {
    // Kategori ID'sine göre servis verisini al
    let serviceData;
    if (categoryId === 'selectedCategory' && newServices?.selectedCategory) {
      serviceData = newServices.selectedCategory;
      categoryId = serviceData.categoryId || '';
    } else {
      serviceData = newServices[categoryId];
    }
    
    if (!serviceData?.name || !serviceData?.duration || !serviceData?.price) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Tüm alanları doldurun"
      });
      return;
    }
    
    try {
      console.log("Hizmet ekleme işlemi başladı (HATA TEŞHİS):", { 
        kategoriId: categoryId,
        hizmetAdı: serviceData.name,
        süre: serviceData.duration,
        fiyat: serviceData.price 
      });
      
      // API verilerini hazırla
      const serviceFormValues = {
        name: serviceData.name,
        description: '',
        price: parseFloat(serviceData.price),
        duration: parseInt(serviceData.duration),
        categoryId: categoryId,
        isActive: true
      };
      console.log("Oluşturulan service verileri (HATA TEŞHİS):", serviceFormValues);
      
      try {
        // Direkt API çağrısı - Debug için
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serviceFormValues),
        });
        
        const result = await response.json();
        console.log("API yanıtı (HATA TEŞHİS):", result);
        
        if (result.success) {
          // Başarılı yanıt - UI güncelle
          setUpdateCounter(prev => prev + 1);
          setNewServices(prev => ({
            ...prev,
            [categoryId]: { name: '', duration: '', price: '' }
          }));
          toast({
            title: "Başarılı",
            description: "Hizmet başarıyla eklendi"
          });
          // Veri güncellemek için services listesini yeniden yüklüyoruz
          await fetchServices();
        } else {
          toast({
            variant: "destructive",
            title: "Hata",
            description: result.error || "Hizmet eklenirken bir sorun oluştu"
          });
        }
      } catch (apiError) {
        console.error("API çağrısı hatası (HATA TEŞHİS):", apiError);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Hizmet eklenirken bir hata oluştu: " + (apiError.message || "Bilinmeyen hata")
        });
      }
    } catch (error) {
      console.error("Hizmet ekleme hatası (HATA TEŞHİS):", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Hizmet eklenirken bir hata oluştu"
      });
    }
  }, [newServices, toast, setUpdateCounter, fetchServices]);
  
  // Yeni hizmet alanlarını güncelleme
  const handleNewServiceChange = useCallback((categoryId: string, field: string, value: string) => {
    if (categoryId === 'selectedCategory') {
      setNewServices(prev => ({
        ...prev,
        selectedCategory: {
          ...prev?.selectedCategory || { categoryId: '', name: '', duration: '', price: '' },
          [field]: value
        }
      }));
    } else {
      setNewServices(prev => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId] || { name: '', duration: '', price: '' },
          [field]: value
        }
      }));
    }
  }, []);
  
  // Yetkisi var mı kontrolü
  console.log("ServicesPage - Detaylı yetki durumu:", {
    canView: permissions.canView,
    canAdd: permissions.canAdd,
    canEdit: permissions.canEdit,
    canDelete: permissions.canDelete,
    tümPermissions: permissions
  });
  
  if (!permissions.canView) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-500">Hizmetleri görüntüleme yetkiniz bulunmuyor.</p>
          <p className="text-sm text-gray-400 mt-2">Debug bilgisi: {JSON.stringify({canView: permissions.canView})}</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Yükleniyor...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Hizmetler</h1>
          
          {permissions.canAdd && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setNewCategoryModal({ isOpen: true })}
                className="bg-[#204937] hover:bg-[#183b2d] text-white whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" /> Yeni Kategori
              </Button>
              
              <Button 
                onClick={() => setNewServiceModal({ isOpen: true })}
                className="bg-[#204937] hover:bg-[#183b2d] text-white whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" /> Yeni Hizmet Ekle
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Kategoriler ve Hizmetler */}
      <div className="text-center">
        {categories.length === 0 ? (
          <EmptyServiceState 
            onAddCategory={() => setNewCategoryModal({ isOpen: true })} 
            onAddService={() => setNewServiceModal({ isOpen: true })}
          />
        ) : (
          <div className="space-y-4">
            {categories.map(category => (
              <div key={category.id} className="rounded-lg overflow-hidden bg-white transition-all mb-2 shadow-md">
                {/* Kategori Başlığı */}
                <div
                  className="px-4 py-2 flex justify-between items-center cursor-pointer bg-gray-200"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex-1 flex items-center">
                    <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${expandedCategories.includes(category.id) ? 'transform rotate-180' : ''}`} />
                    <h3 className="text-sm font-medium">{category.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500 mr-3">
                      {services.filter(s => s.categoryId === category.id).length} hizmet
                    </div>
                    {permissions.canEdit && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Ana div'in tıklama olayını engeller
                          setEditCategoryModal({
                            isOpen: true,
                            categoryId: category.id,
                            categoryName: category.name
                          });
                        }}
                        className="text-yellow-500 hover:text-yellow-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm"
                        aria-label="Kategori Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {permissions.canDelete && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Ana div'in tıklama olayını engeller
                          setDeleteCategoryModal({
                            isOpen: true,
                            categoryId: category.id,
                            categoryName: category.name,
                            serviceCount: services.filter(s => s.categoryId === category.id).length
                          });
                        }}
                        className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm"
                        aria-label="Kategori Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Kategori İçeriği - Genişletildiğinde görünür */}
                {expandedCategories.includes(category.id) && (
                  <div className="p-4 space-y-4">
                    {/* Yeni Hizmet Ekleme Formu - Üst Sırada */}
                    {/* Artık burada değil, sayfanın üst kısmına taşındı */}
                    
                    {/* Mevcut Hizmetler */}
                    {services.filter(s => s.categoryId === category.id).length > 0 ? (
                      <div className="space-y-3">
                        {services
                          .filter(s => s.categoryId === category.id)
                          .map(service => (
                            <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-lg transition-all hover:shadow-xl hover:bg-white">
                              <div className="text-sm font-medium">{service.name}</div>
                              <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-600">{service.duration} dk</div>
                                <div className="text-sm font-medium">{service.price} TL</div>
                                
                                {permissions.canEdit && (
                                  <button 
                                    onClick={() => setEditServiceModal({
                                      isOpen: true,
                                      serviceId: service.id
                                    })}
                                    className="text-yellow-500 hover:text-yellow-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
                                    aria-label="Hizmet Düzenle"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                )}
                                
                                {permissions.canDelete && (
                                  <button 
                                    onClick={() => setDeleteServiceModal({
                                      isOpen: true,
                                      serviceId: service.id,
                                      serviceName: service.name
                                    })}
                                    className="text-red-500 hover:text-red-700 bg-white hover:bg-gray-50 flex items-center justify-center w-6 h-6 rounded-full shadow-sm border-0 transition-all p-0"
                                    aria-label="Hizmet Sil"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Bu kategoride henüz hizmet bulunmuyor.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Edit Service Modal */}
      {editServiceModal.isOpen && (
        <EditServiceModal
          isOpen={editServiceModal.isOpen}
          onClose={() => {
            setEditServiceModal({ isOpen: false, serviceId: '' });
            setUpdateCounter(prev => prev + 1);
          }}
          serviceId={editServiceModal.serviceId}
        />
      )}
      
      {/* Delete Service Modal */}
      {deleteServiceModal.isOpen && (
        <DeleteServiceModal
          isOpen={deleteServiceModal.isOpen}
          onClose={() => {
            setDeleteServiceModal({ isOpen: false, serviceId: '', serviceName: '' });
            setUpdateCounter(prev => prev + 1);
          }}
          serviceId={deleteServiceModal.serviceId}
          serviceName={deleteServiceModal.serviceName}
        />
      )}
      
      {/* Edit Category Modal */}
      {editCategoryModal.isOpen && (
        <EditCategoryModal
          isOpen={editCategoryModal.isOpen}
          onClose={() => {
            setEditCategoryModal({ isOpen: false, categoryId: '', categoryName: '' });
            setUpdateCounter(prev => prev + 1);
          }}
          categoryId={editCategoryModal.categoryId}
          categoryName={editCategoryModal.categoryName}
        />
      )}
      
      {/* Delete Category Modal */}
      {deleteCategoryModal.isOpen && (
        <DeleteCategoryModal
          isOpen={deleteCategoryModal.isOpen}
          onClose={() => {
            setDeleteCategoryModal({ isOpen: false, categoryId: '', categoryName: '', serviceCount: 0 });
            setUpdateCounter(prev => prev + 1);
          }}
          categoryId={deleteCategoryModal.categoryId}
          categoryName={deleteCategoryModal.categoryName}
          serviceCount={deleteCategoryModal.serviceCount}
        />
      )}
      
      {/* New Category Modal */}
      <DialogWithoutPrevent open={newCategoryModal.isOpen} onOpenChange={(open) => {
        if (!open) setNewCategoryModal({ isOpen: false });
      }}>
        <DialogWithoutPreventContent className="sm:max-w-[500px] px-8 py-6 bg-white rounded-lg shadow-2xl border-0 mx-auto">
          <VisuallyHidden>
            <DialogWithoutPreventTitle>Yeni Kategori Ekle</DialogWithoutPreventTitle>
          </VisuallyHidden>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Kategori adını girin"
                className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
                style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              />
            </div>
          </div>

          <Button 
              onClick={async () => {
                await handleAddCategory();
                setNewCategoryModal({ isOpen: false });
              }}
              className="w-full mx-auto mt-6 shadow-md hover:shadow-lg bg-[#204937] hover:bg-[#183b2d] text-white"
            >
              Yeni kategori ekle
            </Button>
        </DialogWithoutPreventContent>
      </DialogWithoutPrevent>
      
      {/* New Service Modal */}
      <DialogWithoutPrevent open={newServiceModal.isOpen} onOpenChange={(open) => {
        if (!open) setNewServiceModal({ isOpen: false });
      }}>
        <DialogWithoutPreventContent className="sm:max-w-[500px] px-8 py-6 bg-white rounded-lg shadow-2xl border-0 mx-auto">
          <VisuallyHidden>
            <DialogWithoutPreventTitle>Yeni Hizmet Ekle</DialogWithoutPreventTitle>
          </VisuallyHidden>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Select 
                value={newServices?.selectedCategory?.categoryId || ""}
                onValueChange={(value) => {
                  setNewServices(prev => ({
                    ...prev,
                    selectedCategory: {
                      ...prev?.selectedCategory || { name: '', duration: '', price: '' },
                      categoryId: value,
                    }
                  }));
                }}
              >
                <SelectTrigger id="serviceCategory" className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                  <SelectValue placeholder="Kategori Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Input
                id="serviceName"
                value={newServices?.selectedCategory?.name || ''}
                onChange={(e) => handleNewServiceChange('selectedCategory', 'name', e.target.value)}
                placeholder="Hizmet adı"
                className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
                style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Input
                  id="serviceDuration"
                  type="number"
                  min="5"
                  step="5"
                  value={newServices?.selectedCategory?.duration || ''}
                  onChange={(e) => handleNewServiceChange('selectedCategory', 'duration', e.target.value)}
                  placeholder="Süre (dk)"
                  className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
                  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                />
              </div>
              
              <div className="grid gap-2">
                <Input
                  id="servicePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newServices?.selectedCategory?.price || ''}
                  onChange={(e) => handleNewServiceChange('selectedCategory', 'price', e.target.value)}
                  placeholder="Fiyat (TL)"
                  className="w-full bg-white border-0 rounded-[8px] px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-md hover:shadow-lg transition-all"
                  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                />
              </div>
            </div>
          </div>
          
          <Button 
              onClick={async () => {
                if (newServices?.selectedCategory?.categoryId) {
                  await handleAddService('selectedCategory');
                  setNewServiceModal({ isOpen: false });
                  setNewServices(prev => ({
                    ...prev,
                    selectedCategory: { categoryId: '', name: '', duration: '', price: '' }
                  }));
                } else {
                  toast({
                    variant: "destructive",
                    title: "Hata",
                    description: "Lütfen bir kategori seçin"
                  });
                }
              }}
              className="w-full mx-auto mt-6 shadow-md hover:shadow-lg bg-[#204937] hover:bg-[#183b2d] text-white"
            >
              Yeni hizmet ekle
            </Button>
        </DialogWithoutPreventContent>
      </DialogWithoutPrevent>
    </div>
  );
}