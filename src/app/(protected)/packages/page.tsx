'use client';

import { withPageAuth } from '@/lib/auth';
import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import PackageModal from '@/components/packages/PackageModal';
import DeletePackageModal from '@/components/packages/DeletePackageModal';
import { PackageListItem } from '@/components/packages/PackageListItem';
import { usePackageManagement } from '@/hooks/package';
import { usePackageCache } from '@/hooks/package';
import { PackageWithRelations, PackageWithServices } from '@/types/package';

function PackagesPage() {
  const [editingPackage, setEditingPackage] = useState<PackageWithRelations | PackageWithServices | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewPackageOpen, setIsNewPackageOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, packageId: "", packageName: "" });
  const { toast } = useToast();
  
  // Yükleme durumlarını takip et - her paket için ayrı yükleme durumu
  const [loadingPackageIds, setLoadingPackageIds] = useState<{ [key: string]: { deleting: boolean; updating: boolean } }>({});
  
  // Önbellek ve yükleme durumu hook'unu kullan
  const { 
    isLoading, 
    isError, 
    LoadingState,
    getError 
  } = usePackageCache();
  
  // Yeni grup yapısına göre hook'u kullan - önbellek sistemiyle
  const {
    state: { packages, error },
    operations: { fetchPackages, handleDeletePackage, handleUpdatePackage, handleCreatePackage, handleCreatePackageWithData },
    form: { setFormData },
    helpers: { groupedPackages },
    permissions
  } = usePackageManagement({ 
    autoFetch: true, 
    showToasts: true,
    cacheEnabled: true // Önbellek sistemini etkinleştir
  });

  // Daha detaylı yükleme durumu kontrolü
  const isPageLoading = isLoading('packages');

  // Paketler değiştiğinde log ekle
  useEffect(() => {
    console.log("[PAKETLER-SAYFASI] packages değişti:", packages);
    console.log("[PAKETLER-SAYFASI] packages uzunluk:", packages.length);
    console.log("[PAKETLER-SAYFASI] packages veri tipi:", typeof packages);
    console.log("[PAKETLER-SAYFASI] packages dizi mi?", Array.isArray(packages));
    
    // İlk paket kontrolü
    if (packages.length > 0) {
      console.log("[PAKETLER-SAYFASI] İlk paket örneği:", packages[0]);
      console.log("[PAKETLER-SAYFASI] İlk paket alanları:", Object.keys(packages[0]));
      console.log("[PAKETLER-SAYFASI] İlk paket kategori bilgisi:", packages[0].category);
      console.log("[PAKETLER-SAYFASI] İlk paket services bilgisi:", packages[0].services);
      
      if (packages[0].services) {
        console.log("[PAKETLER-SAYFASI] İlk paket servis sayısı:", 
          Array.isArray(packages[0].services) ? packages[0].services.length : 'dizi değil');
      }
    }
    
    console.log("[PAKETLER-SAYFASI] groupedPackages:", groupedPackages);
    console.log("[PAKETLER-SAYFASI] groupedPackages tipi:", typeof groupedPackages);
    
    // Gruplandırılmış paketlerin yapısını ve kategori sayısını kontrol et
    console.log("[PAKETLER-SAYFASI] Kategori sayısı:", Object.keys(groupedPackages).length);
    console.log("[PAKETLER-SAYFASI] Kategoriler:", Object.keys(groupedPackages));
    
    // API yanıtı detaylarını ve yükleme durumunu logla
    console.log("[PAKETLER-SAYFASI] API yanıtı detayları:", { 
      isLoading: isPageLoading, 
      isError, 
      error,
      groupedPackages, 
      packages 
    });
  }, [packages, groupedPackages, isPageLoading, isError, error]);

  // Silme dialogunu aç
  const openDeleteDialog = (pkg: PackageWithRelations | PackageWithServices) => {
    if (!permissions.canDelete) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Paket silme yetkiniz bulunmamaktadır"
      });
      return;
    }

    // Silme modalini aç
    setDeleteModal({
      isOpen: true,
      packageId: pkg.id,
      packageName: pkg.name
    });
  };

  // Silme işlemi - artık doğrudan dialog içinden çağrılıyor
  const handleDelete = async (id: string) => {
    try {
      // İlgili paketin silme durumunu güncelle
      setLoadingPackageIds(prev => ({
        ...prev,
        [id]: { ...prev[id], deleting: true }
      }));
      
      // Silme işlemini başlat - akillı silme mekanizması ile
      await handleDeletePackage(id);
      
      // Paketleri yeniden yükle
      await fetchPackages();
    } finally {
      // İşlem tamamlandığında durumu sıfırla
      setLoadingPackageIds(prev => ({
        ...prev,
        [id]: { ...prev[id], deleting: false }
      }));
    }
  };

  // Güncelleme işlemi
  const handleUpdateField = async (id: string, data: any) => {
    console.log('[PAKET-GUNCELLEME] [4] page.handleUpdateField çağrıldı');
    console.log('[PAKET-GUNCELLEME] [4] Güncellenecek paket ID:', id);
    console.log('[PAKET-GUNCELLEME] [4] Güncelleme verileri:', JSON.stringify(data, null, 2));
    
    try {
      // İlgili paketin güncelleme durumunu güncelle
      setLoadingPackageIds(prev => ({
        ...prev,
        [id]: { ...prev[id], updating: true }
      }));
      
      console.log('[PAKET-GUNCELLEME] [4] Güncelleme başlatılıyor, veriler:', JSON.stringify(data, null, 2));
      
      // Form verilerini güncelle
      setFormData({
        ...data,
        id
      });
      console.log('[PAKET-GUNCELLEME] [4] Form verileri güncellendi');
      
      // Doğrudan verileri gönder - artık kısmi güncelleme destekleniyor
      console.log('[PAKET-GUNCELLEME] [4] handleUpdatePackage çağrılıyor...');
      const result = await handleUpdatePackage(id, data);
      console.log('[PAKET-GUNCELLEME] [4] handleUpdatePackage tamamlandı, sonuç:', result ? 'Başarılı' : 'Başarısız');
      
      if (result) {
        console.log('[PAKET-GUNCELLEME] [4] Güncelleme BAŞARILI, toast gösteriliyor');
        toast({
          title: "Başarılı",
          description: "Paket başarıyla güncellendi",
        });
        
        // Önbellekteki tüm paketleri yenile
        console.log('[PAKET-GUNCELLEME] [4] Paketler zorla yeniden yükleniyor...');
        
        // Önbelleği tamamen temizle ve yeniden yükle
        // Not: cacheUtils.refreshPackageCache kullanıyorum
        try {
          const { cacheUtils } = require('@/utils/cache/packageCache');
          console.log('[PAKET-GUNCELLEME] [4] cacheUtils.refreshPackageCache çağrılıyor...');
          await cacheUtils.refreshPackageCache(() => fetchPackages());
          console.log('[PAKET-GUNCELLEME] [4] Önbellek tamamen temizlendi ve paketler yeniden yüklendi');
        } catch (cacheError) {
          console.error('[PAKET-GUNCELLEME] [4] Önbellek yenileme hatası:', cacheError);
          // Hata olursa normal fetchPackages ile devam et
          await fetchPackages();
        }
        
        // Yüklenmiş paketleri görüntüle - son durumu görmek için
        console.log('[PAKET-GUNCELLEME] [4] Güncel paket listesi:', JSON.stringify(packages, null, 2));
      } else {
        console.error('[PAKET-GUNCELLEME] [4] Güncelleme BAŞARISIZ, null döndü');
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Paket güncellenirken bir hata oluştu",
        });
      }
    } catch (err) {
      console.error('[PAKET-GUNCELLEME] [4] Güncelleme HATASI:', err);
      console.error('[PAKET-GUNCELLEME] [4] Hata açıklaması:', err instanceof Error ? err.message : 'Bilinmeyen hata');
      console.error('[PAKET-GUNCELLEME] [4] Hata yığını:', err instanceof Error ? err.stack : 'Yok');
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Paket güncellenirken bir hata oluştu",
      });
    } finally {
      // İşlem tamamlandığında durumu sıfırla
      setLoadingPackageIds(prev => ({
        ...prev,
        [id]: { ...prev[id], updating: false }
      }));
      console.log('[PAKET-GUNCELLEME] [4] Güncelleme işlemi tamamlandı');
    }
  };

  // Düzenleme işlemi
  const handleEdit = (pkg: PackageWithRelations | PackageWithServices) => {
    if (!permissions.canEdit) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Paket düzenleme yetkiniz bulunmamaktadır"
      });
      return;
    }

    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  // Sayfa erişim kontrolü
  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Yetkisiz Erişim</h1>
          <p className="mt-2">Paketler sayfasını görüntüleme yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  // Yükleniyor göstergesi
  if (isPageLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render öncesi konsol logları ekle
  console.log("[PAKETLER-SAYFASI] Render edilirken mevcut paket sayısı:", packages.length);
  console.log("[PAKETLER-SAYFASI] Render edilirken groupedPackages:", groupedPackages);
  console.log("[PAKETLER-SAYFASI] Render edilirken groupedPackages key'leri:", Object.keys(groupedPackages));
  console.log("[PAKETLER-SAYFASI] Render edilirken groupedPackages değer sayıları:", 
              Object.entries(groupedPackages).map(([key, items]) => `${key}: ${items.length} paket`));
  
  // Gruplandırma API dışında da yapılıyor mu kontrol et
  const manualGroupedPackages = {};
  if (packages.length > 0) {
    packages.forEach(pkg => {
      const categoryName = pkg.category?.name || 'Kategorisiz';
      if (!manualGroupedPackages[categoryName]) {
        manualGroupedPackages[categoryName] = [];
      }
      manualGroupedPackages[categoryName].push(pkg);
    });
    console.log("[PAKETLER-SAYFASI] Manuel gruplandırma sonucu:", 
                Object.keys(manualGroupedPackages).map(key => `${key}: ${manualGroupedPackages[key].length} paket`));
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Paketler</h1>
        {permissions.canAdd && (
          <Button
            onClick={() => setIsNewPackageOpen(true)}
            className="bg-[#204937] hover:bg-[#183b2d] text-white whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Paket
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {Object.keys(groupedPackages).length > 0 ? (
          Object.entries(groupedPackages).map(([categoryName, categoryPackages]) => (
            <div key={categoryName} className="rounded-lg overflow-hidden bg-white transition-all mb-4 shadow-md">
              <div className="px-4 py-2 flex justify-between items-center bg-gray-200">
                <div className="flex-1 flex items-center">
                  <h3 className="text-sm font-medium">{categoryName}</h3>
                </div>
                <div className="text-xs text-gray-500 mr-3">
                  {categoryPackages.length} paket
                </div>
              </div>
              <div className="p-4 space-y-4">
                {categoryPackages.map((pkg) => {
                  // Her paket için yükleme durumunu al, yoksa varsayılan değerleri kullan
                  const loadingState = loadingPackageIds[pkg.id] || { deleting: false, updating: false };
                  
                  return (
                    <PackageListItem
                      key={pkg.id}
                      pkg={pkg}
                      isDeleting={loadingState.deleting}
                      isUpdating={loadingState.updating}
                      onDelete={permissions.canDelete ? openDeleteDialog : undefined}
                      onUpdate={permissions.canEdit ? handleUpdateField : undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))
        ) : packages.length > 0 ? (
          // Eğer gruplandırma boşsa ama paketler varsa, paketleri düz liste olarak göster
          <div className="p-4 space-y-4">
            <div className="text-sm font-medium mb-2">Tüm Paketler</div>
            {packages.map((pkg) => {
              const loadingState = loadingPackageIds[pkg.id] || { deleting: false, updating: false };
              return (
                <PackageListItem
                  key={pkg.id}
                  pkg={pkg}
                  isDeleting={loadingState.deleting}
                  isUpdating={loadingState.updating}
                  onDelete={permissions.canDelete ? openDeleteDialog : undefined}
                  onUpdate={permissions.canEdit ? handleUpdateField : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 p-6">
            Henüz hiç paket eklenmemiş.
          </div>
        )}
      </div>

      {/* Yeni Paket Modalı */}
      <PackageModal
        isOpen={isNewPackageOpen}
        onClose={() => setIsNewPackageOpen(false)}
        onSubmit={async (formData) => {
          try {
            console.log("[PAKETLER-SAYFASI] Form verileri alındı:", formData);
            console.log("[PAKETLER-SAYFASI] Önceki paket sayısı:", packages.length);
            console.log("[PAKETLER-SAYFASI] Önceki gruplandırılmış paketler:", Object.keys(groupedPackages));
            
            if (!handleCreatePackageWithData) {
              throw new Error("handleCreatePackageWithData fonksiyonu tanımlı değil");
            }
            
            // Doğrudan gelen verilerle paket oluştur
            console.log("[PAKETLER-SAYFASI] handleCreatePackageWithData çağrılıyor...");
            const result = await handleCreatePackageWithData(formData);
            console.log("[PAKETLER-SAYFASI] handleCreatePackageWithData sonucu:", result);
            
            // Yanıt başarılı mı kontrol et
            if (result && result.success === true) {
              console.log("[PAKETLER-SAYFASI] Paket başarıyla oluşturuldu, veri:", result.data);
              toast({
                title: "Başarılı",
                description: "Paket başarıyla oluşturuldu"
              });
              
              // Modalı kapat
              setIsNewPackageOpen(false);
              
              // Paketleri yeniden yükle
              console.log("[PAKETLER-SAYFASI] fetchPackages çağrılıyor...");
              await fetchPackages();
              console.log("[PAKETLER-SAYFASI] fetchPackages tamamlandı, yeni paket sayısı:", packages.length);
            } else {
              // Başarısız ise hata mesajı göster
              const errorMsg = result && result.error ? result.error : "Paket oluşturulurken bir hata oluştu";
              console.error('[DEBUG-PACKAGE] Paket oluşturma başarısız:', errorMsg);
              toast({
                variant: "destructive",
                title: "Hata",
                description: errorMsg,
              });
            }
          } catch (err) {
            console.error('[DEBUG-PACKAGE] Paket oluşturma hatası:', err);
            toast({
              variant: "destructive",
              title: "Hata",
              description: err instanceof Error ? err.message : "Paket oluşturulurken bir hata oluştu",
            });
          }
        }}
        packageData={null}
        fetchPackages={fetchPackages}
      />

      {/* Düzenleme Modalı */}
      <PackageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (formData) => {
          try {
            if (editingPackage) {
              console.log("Güncelleme form verileri alındı:", formData);
              
              // İlgili paketin güncelleme durumunu güncelle
              if (editingPackage && editingPackage.id) {
                setLoadingPackageIds(prev => ({
                  ...prev,
                  [editingPackage.id]: { ...prev[editingPackage.id] || {}, updating: true }
                }));
              }
              
              // Form verilerini hook state'ine set et
              setFormData(formData);
              
              // updatePackage hook fonksiyonunu kullan
              if (editingPackage && editingPackage.id) {
                const result = await handleUpdatePackage(editingPackage.id);
                
                if (result) {
                  toast({
                    title: "Başarılı",
                    description: "Paket başarıyla güncellendi",
                  });
                  
                  setIsModalOpen(false);
                  setEditingPackage(null);
                  await fetchPackages();
                }
              }
              
              // İşlem tamamlandığında durumu sıfırla
              if (editingPackage && editingPackage.id) {
                setLoadingPackageIds(prev => ({
                  ...prev,
                  [editingPackage.id]: { ...prev[editingPackage.id] || {}, updating: false }
                }));
              }
            }
          } catch (err) {
            toast({
              variant: "destructive",
              title: "Hata",
              description: "Paket güncellenirken bir hata oluştu",
            });
            
            // Hata durumunda da durumu sıfırla
            if (editingPackage && editingPackage.id) {
              setLoadingPackageIds(prev => ({
                ...prev,
                [editingPackage.id]: { ...prev[editingPackage.id] || {}, updating: false }
              }));
            }
          }
        }}
        packageData={editingPackage}
        fetchPackages={fetchPackages}
      />

      {/* Silme Modalı */}
      <DeletePackageModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, packageId: "", packageName: "" })}
        packageId={deleteModal.packageId}
        packageName={deleteModal.packageName}
      />
    </div>
  );
}

export default withPageAuth(PackagesPage);