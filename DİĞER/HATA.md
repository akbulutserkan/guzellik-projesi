# Hizmetler Sayfası Otomatik Güncelleme Sorunu ve Çözümü

## Sorun

Hizmetler sayfasında bir düzenleme (edit) işlemi gerçekleştirildiğinde, yapılan değişiklikler veritabanına kaydediliyor ancak kullanıcı arayüzünde anında görüntülenmiyordu. Değişikliklerin görünür olması için kullanıcının sayfayı yenilemesi ya da 30 saniyelik otomatik yenileme sürecinin tamamlanmasını beklemesi gerekiyordu.

## Sorunun Analizi

Analiz sonucunda şu temel sorunlar tespit edildi:

1. **Veri Akış Sorunu**: Güncellemeler veritabanında yapılıp başarılı oluyordu, ancak bu güncellemeler UI'a yansımıyordu.

2. **Gereksiz API İstekleri**: Her işlem sonrası tüm hizmet listesini tekrar getiren `fetchServices()` fonksiyonu çağrılıyordu. Bu yaklaşım:
   - Ekstra network trafiği yaratıyordu
   - Zaman alıyordu (özellikle büyük veri setlerinde)
   - Kullanıcı deneyimini olumsuz etkiliyordu

3. **Bağlantı Eksikliği**: Modal bileşenleri (EditServiceModal gibi) ile ana sayfa arasında güncelleme tetikleyici bir mekanizma yoktu.

4. **Performans İssue**: 30 saniyede bir otomatik yenileme sırasında tüm arayüz tekrar yükleniyordu.

## Uygulanan Çözümler

Sorunları dengeli yaklaşım mimarisine uygun şekilde çözmek için şu değişiklikler yapıldı:

### 1. Yerel State Güncellemesi

Veritabanı güncellemesi başarılı olduğunda, aynı API yanıtını kullanarak yerel state'i güncelleyen bir yaklaşım geliştirildi. Bu sayede:

- Ekstra API isteği yapılmadan UI güncellemesi sağlandı
- Güncel veri kullanıldığı için veri tutarlılığı korundu

```typescript
// Örnek: useServiceManagement.ts içindeki handleUpdateService fonksiyonu
const handleUpdateService = useCallback(async (serviceId: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const updatedService = await updateService({
      id: serviceId,
      ...serviceFormData
    }, showToasts);
    
    // İşlem zamanını güncelle
    lastOperationTime.current = Date.now();
    
    // Yerel state'i güncelle - ekstra API isteği yapmadan
    setServices(prevServices => 
      prevServices.map(service => 
        service.id === serviceId ? updatedService : service
      )
    );
    
    return updatedService;
  } catch (error: any) {
    setError(error instanceof Error ? error.message : 'Hizmet güncellenirken bir hata oluştu');
    return null;
  } finally {
    setLoading(false);
  }
}, [serviceFormData, showToasts, updateService]);
```

### 2. Sessiz Yenileme Mekanizması

Periyodik güncellemeler için "sessiz yenileme" mekanizması geliştirildi:

```typescript
const silentRefresh = useCallback(async () => {
  try {
    // Loading state'ini değiştirme
    setError(null);
    
    // Verileri al
    const [categoriesData, servicesData] = await Promise.all([
      getServiceCategories(false), // Toast gösterme
      getServices(filters, false)  // Toast gösterme
    ]);
    
    // State'leri güncelle
    if (Array.isArray(categoriesData)) {
      setCategories(categoriesData);
    }
    
    if (Array.isArray(servicesData)) {
      setServices(servicesData);
    }
    
    // İşlem zamanını güncelle
    lastOperationTime.current = Date.now();
  } catch (error) {
    console.error('Sessiz yenileme sırasında hata:', error);
    // Hata gösterme, kullanıcıyı rahatsız etmemek için
  }
}, [filters]);
```

### 3. Modal Kapanma Sonrası Güncelleme Tetikleyici

Modal bileşenleri kapatıldığında ana sayfanın güncellemesini tetikleyen bir mekanizma eklendi:

```typescript
// services/page.tsx içinde
// Güncelleme tetikleyici state
const [updateCounter, setUpdateCounter] = useState(0);

// Modal kapatma işleyicisi
onClose={() => {
  setEditServiceModal({ isOpen: false, serviceId: '' });
  // Modal kapanınca güncellemeyi tetikle
  setUpdateCounter(prev => prev + 1);
}}

// Güncelleme tetikleyiciyi dinleyen useEffect
useEffect(() => {
  console.log('Hizmetler sayfası güncelleniyor. Güncelleme Counter:', updateCounter);
  fetchCategories();
  fetchServices();
}, [fetchCategories, fetchServices, updateCounter]);
```

## Yapılan Değişikliklerin Özeti

1. **Hook'larda Değişiklikler**:
   - CRUD operasyonlarından sonra state güncellemesi ekledik
   - Sessiz yenileme mekanizması geliştirdik
   - Dependency array'lerini optimize ettik

2. **Modal Bileşenlerinde Değişiklikler**:
   - Log ekleyerek hata ayıklama kolaylaştırıldı
   - Güncellemelerin başarılı olduğunu doğrulamak için kontroller eklendi

3. **Ana Sayfada Değişiklikler**:
   - Güncelleme tetikleyici state eklendi
   - Modal kapanışlarını izleyen ve güncelleme tetikleyen işleyiciler eklendi
   - useEffect bağımlılıklarını güncelleyerek tetikleyiciye tepki vermesi sağlandı

## Elde Edilen Kazanımlar

Bu değişiklikler sayesinde:

1. **Anında UI Güncellemesi**: Kullanıcılar artık bir değişiklik yaptıklarında anında sonuçları görebiliyorlar, sayfayı yenileme ihtiyacı ortadan kalktı.

2. **Daha Az API İsteği**: Gereksiz API istekleri kaldırıldı, bu da sunucu yükünü ve ağ trafiğini azalttı.

3. **Daha İyi Kullanıcı Deneyimi**: Yükleme göstergeleri ve ekran titremeleri olmadan güncellemeler yapılabiliyor.

4. **Veri Tutarlılığı**: Veritabanı güncellemeleri ve UI gösterimi arasında tutarlılık sağlandı.

5. **Dengeli Yaklaşım**: Backend ve frontend arasında dengeli sorumluluk dağılımı korundu.

## Mimari Prensiplere Uygunluk

Yapılan değişiklikler, dengeli yazılım mimarisi prensiplerine tam uyumludur:

1. **İş Mantığı Ayrımı**: Veri işleme ve formatlaması hala doğru katmanlarda (servis/util/hook).

2. **Tekrar Kullanılabilirlik**: Geliştirilen çözümler diğer modüllere de uygulanabilir (müşteriler, personel vb.).

3. **API Verimliliği**: Gereksiz istekleri azaltarak sistem performansını artırıyor.

4. **Veri Tutarlılığı**: Backend ve frontend arasında veri tutarlılığını garantiliyor.

Bu çözümü diğer benzer bileşenlere (müşteriler, personel, randevular) de uygulamanız önerilir.



--------------------------------------------

# Hizmet Kategori Güncelleme Sorunu ve Çözümü

## Sorun Açıklaması

Hizmetler sayfasındaki düzenleme modalında bir hizmetin kategorisini değiştirdiğimizde, yeni kategori bilgisi veritabanına kaydedilmiyordu. Diğer alanlar (isim, fiyat, süre) başarıyla güncellenirken, kategori değişiklikleri görmezden geliniyordu.

## Sorunun Analizi

Sistem incelendiğinde sorunun kaynağı belirlendi:

1. Frontend (React) tarafında kategori değişiklikleri doğru şekilde algılanıyor ve gönderiliyordu.
2. `serviceService.ts` içindeki `updateService` fonksiyonu, `categoryId` parametresini API'ye gönderiyordu.
3. Sorun, backend tarafındaydı: `/app/mcp-tools/services.ts` içindeki `update-service` tool'u `categoryId` parametresini tanımlamıyordu.

Dengeli yaklaşımda (3 katmanlı yapı) veri akışı şu şekildeydi:
- UI (Modal) → useServiceManagement Hook → serviceService → Backend API (mcp-tools)

Ancak son adımda, Backend API kategoriye ilişkin güncellemeleri kabul etmiyordu.

## Çözüm

Sorunu çözmek için yapılan değişiklikler:

1. `/app/mcp-tools/services.ts` dosyasında `update-service` tool'una `categoryId` parametresi eklendi:

```diff
// Hizmet güncelleme tool'u
server.tool(
  'update-service',
  {
    id: z.string(),
    name: z.string().optional(),
    duration: z.number().min(5).optional(),
    price: z.number().min(0).optional(),
+   categoryId: z.string().optional()
  },
- async ({ id, name, duration, price }) => {
+ async ({ id, name, duration, price, categoryId }) => {
```

2. Aynı dosyada, veritabanı güncelleme işleminde categoryId alanının kullanılması sağlandı:

```diff
// Hizmeti güncelle
const updatedService = await prisma.service.update({
  where: { id },
  data: {
    name: name !== undefined ? name : undefined,
    duration: duration !== undefined ? duration : undefined,
    price: price !== undefined ? price : undefined,
+   categoryId: categoryId !== undefined ? categoryId : undefined
  }
});
```

3. Ayrıca, `UpdateServiceData` arayüzüne de categoryId alanı eklendi:

```diff
interface UpdateServiceData {
  name?: string;
  duration?: number;
  price?: number;
+ categoryId?: string;
}
```

## Öğrenilen Dersler

1. **Dengeli Yaklaşım İncelemesi**: Bu sorun, 3 katmanlı mimaride (UI, Service/Hook, Backend) her katmanın doğru çalışıp çalışmadığını kontrol etmenin önemini göstermiştir.

2. **API Parametre Kontrolü**: Backend API'lerdeki parametre tanımlamalarının eksiksiz olması önemlidir. Herhangi bir eksiklik, veri güncellemelerinin kaybolmasına neden olabilir.

3. **Debug Log Önemi**: Sorunu tespit etmek için katmanlara debug logları eklemek, veri akışının hangi noktada kesildiğini anlamaya yardımcı olmuştur.

## Gelecekte Benzer Sorunlarla Karşılaşmamak İçin

1. Yeni bir özellik eklerken, özelliğin tüm katmanlarda (UI, servis, backend) tam olarak desteklendiğinden emin olun.

2. API tanımlamalarında, servis katmanından gönderilen tüm parametrelerin backend API'de tanımlandığından emin olun.

3. Sorun yaşandığında adım adım veri akışını takip edin ve her katmanda debug logları kullanarak verinin nasıl ilerlediğini gözlemleyin.

4. CRUD işlemleri test edilirken, sadece güncellemenin başarılı olduğu mesajını değil, güncellenen verilerin doğru şekilde kaydedilip kaydedilmediğini de kontrol edin.




---------------------------------------




# Sayfa Yenilenmeden Hizmet Güncelleme İyileştirmesi

## Sorun Açıklaması

Hizmetler sayfasında, bir hizmet güncelleme işlemi gerçekleştirildiğinde tüm sayfa yenileniyor (`window.location.reload()` çağrısı kullanılıyor) ve bu durum kullanıcı deneyimini olumsuz etkiliyor:

1. Açık olan dropdown menüler kapanıyor
2. Genişletilmiş kategori bölümleri kapanıyor
3. Kullanıcı, sayfadaki konumunu ve bağlamını kaybediyor
4. Sayfa yenileme işlemi, özellikle büyük veri setlerinde yavaş olabiliyor

Bu sorun, özellikle birden fazla hizmet üzerinde ardışık değişiklikler yapılırken kullanıcıyı rahatsız ediyordu. Her seferinde açılan kategoriyi tekrar bulmak ve genişletmek zorunda kalıyorlardı.

## Mevcut Durum

Güncelleme sonrasında `EditServiceModal.tsx` dosyasında şu kod çalışıyordu:

```javascript
// Modal kapatılıyor
onClose();

// Tam sayfa yenileme yapılıyor
setTimeout(() => {
  console.log("Sayfa yenileniyor...");
  window.location.reload();
}, 300);

// İkinci kez aynı işlem (muhtemelen bir kodlama hatası)
setTimeout(() => {
  console.log("Sayfa yenileniyor...");
  window.location.reload();
}, 300);
```

Bu yaklaşım, verilerin güncel olmasını garanti ediyor ancak sayfa yenilemesi gerçekleştirerek çok kötü bir kullanıcı deneyimine neden oluyordu.

## Çözüm

Sorunu çözmek için şu değişiklikleri uyguladık:

1. **Sayfa Yenileme Kaldırıldı**: `EditServiceModal.tsx` dosyasından `window.location.reload()` çağrıları kaldırıldı.

2. **Mevcut Güncelleme Mekanizması Kullanıldı**: Zaten `ServicesPage` bileşeninde bulunan ve modallar kapatıldığında tetiklenen `updateCounter` state mekanizması kullanıldı.

3. **Yerel State Güncellemesi Geliştirildi**: `useServiceManagement` hook'unda kategori güncellemelerini daha iyi yönetmek için ek log ve iyileştirmeler yapıldı.

### Değişiklik 1: EditServiceModal.tsx dosyasında

```typescript
// Kaydet
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }
  
  console.log('Hizmet güncelleniyor, ID:', serviceId);
  const result = await handleUpdateService(serviceId);
  
  if (result) {
    console.log('Hizmet güncelleme başarılı, sonuç:', result);
    // Başarılı güncelleme mesajı göster
    toast({
      title: "Başarılı",
      description: "Hizmet başarıyla güncellendi"
    });
    
    // Modal kapatılınca services sayfasının updateCounter'ı 
    // artacak ve bu da verilerin yenilenmesini tetikleyecek
    // Sayfa yenilenmeden güncellenmiş veriler gösterilecek
    onClose();
  }
};
```

### Değişiklik 2: ServicesPage.tsx'deki İşleyici Korundu

```typescript
// Modal kapatma işleyicisi
onClose={() => {
  setEditServiceModal({ isOpen: false, serviceId: '' });
  // Modal kapanınca güncellemeyi tetikle
  setUpdateCounter(prev => prev + 1);
}}

// Güncelleme tetikleyiciyi dinleyen useEffect
useEffect(() => {
  console.log('Hizmetler sayfası güncelleniyor. Güncelleme Counter:', updateCounter);
  fetchCategories();
  fetchServices();
}, [fetchCategories, fetchServices, updateCounter]);
```

### Değişiklik 3: useServiceManagement Hook'undaki İyileştirmeler

```typescript
const handleUpdateService = useCallback(async (serviceId: string) => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('Hizmet güncelleniyor, veriler:', { id: serviceId, ...serviceFormData });
    console.log('Seçilen kategori ID:', serviceFormData.categoryId);
    
    // Kategori bilgisini önce kontrol et
    const categoryBefore = categories.find(c => c.id === serviceFormData.categoryId);
    console.log('Güncellemeden önce bulunan kategori:', categoryBefore);
    
    // Kategorileri detaylı görüntüle
    console.log('Mevcut kategoriler:', categories.map(c => ({ id: c.id, name: c.name })));
    
    const updateData = {
      id: serviceId,
      ...serviceFormData
    };
    
    console.log('Gönderilecek güncelleme verileri:', updateData);
    
    const updatedService = await updateService(updateData, showToasts);
    
    console.log('API yanıtı:', updatedService);
    
    // İşlem zamanını güncelle
    lastOperationTime.current = Date.now();
    
    // Yerel state'i güncelle - ekstra API isteği yapmadan
    if (updatedService) {
      console.log('Hizmet başarıyla güncellendi. Güncellenmiş veri:', updatedService);
      
      // Kategori adını bul
      const categoryAfter = categories.find(c => c.id === updatedService.categoryId);
      console.log('Güncelleme sonrası kategori bilgisi:', categoryAfter);
      
      // Kategori bulunamadıysa hata ayıklama
      if (!categoryAfter) {
        console.warn('Dikkat: Güncellenen hizmet için kategori bulunamadı!', {
          hizmetKategoriId: updatedService.categoryId,
          mevcutKategoriler: categories.map(c => c.id)
        });
      }
      
      // Services state'ini güncelle - ekstra API isteği yapmadan
      setServices(prevServices => {
        // Güncellenmiş hizmet listesi oluştur
        const updatedServices = prevServices.map(service => 
          service.id === serviceId ? {
            ...updatedService,
            categoryName: categoryAfter?.name || 'Kategori Bulunamadı'
          } : service
        );
        
        console.log(`Hizmet (${serviceId}) kategorisi güncellendi`, {
          eskiKategori: categoryBefore?.name || 'Bilinmiyor',
          yeniKategori: categoryAfter?.name || 'Bulunamadı'
        });
        
        return updatedServices;
      });
      
      // Seçili servisi de güncelle
      if (selectedService && selectedService.id === serviceId) {
        setSelectedService({
          ...updatedService,
          categoryName: categoryAfter?.name || 'Kategori Bulunamadı'
        });
        console.log('Seçili servis güncellendi');
      }
    }
    
    return updatedService;
  } catch (error: any) {
    console.error('Hizmet güncelleme hatası:', error);
    setError(error instanceof Error ? error.message : 'Hizmet güncellenirken bir hata oluştu');
    return null;
  } finally {
    setLoading(false);
  }
}, [serviceFormData, showToasts, categories, selectedService]);
```

## Sonuçlar

Yapılan değişiklikler sonrasında:

1. **Sayfa Yenileme Yok**: Hizmet güncellendiğinde artık sayfa yenilenmiyor.
2. **Dropdown ve Kategori Durumları Korunuyor**: Kullanıcı ara yüzündeki açık dropdown'lar ve genişletilmiş kategoriler aynen kalıyor.
3. **Anında Güncelleme**: Değişiklikler anında kullanıcı ara yüzüne yansıyor.
4. **Daha İyi Hata Ayıklama**: Kategori değişikliklerinde olabilecek sorunları tespit için kapsamlı log'lar eklenmiş durumda.

## Gelecekteki Benzer Sorunlar İçin Tavsiyeler

1. **Sayfa Yenilemeden Kaçının**: Kullanıcı deneyimini iyileştirmek için mümkün olduğunca `window.location.reload()` kullanmaktan kaçının.

2. **State Mekanizmalarını Kullanın**: React'in yerel state mekanizmalarını kullanarak, mevcut sayfanın durumunu koruyarak güncellemeler yapın.

3. **Optimistik UI Güncellemeleri**: API çağrısı tamamlandığında local state'i güncelleyerek, ekstra API isteği olmadan kullanıcıya anında geri bildirim sağlayın.

4. **Hook Tasarım Prensibi**: Hook'ları tasarlarken "sayfa yenileme yapmadan nasıl güncelleyebilirim?" sorusunu kendinize sorun.

5. **Daha İyi Debug Logları**: Kategori ilişkisi gibi kritik güncellemelerde hata ayıklama için yeterli log ekleyin.

Bu iyileştirmeler sayesinde, hizmet güncelleme işlemi artık çok daha akıcı ve kullanıcı dostu bir deneyim sunuyor. Kullanıcılar, ardışık güncelleme işlemlerini kolayca ve sayfa akışını bozmadan gerçekleştirebiliyorlar.






------------------------------------

# React Sonsuz Döngü Hatalarının Çözüm Rehberi

React'ta "Maximum update depth exceeded" hatası, bileşenlerin sürekli olarak kendilerini güncellemesi nedeniyle oluşan sonsuz bir döngüyü gösterir. Projenizdeki hatalar ve bunların çözümleri aşağıda detaylı olarak açıklanmıştır.

## 1. useCustomerManagement.ts'deki Sonsuz Döngü Sorunu

### Sorunun Tanımı
`useCustomerManagement.ts` dosyasındaki `validateForm` fonksiyonu, hem `formErrors` state'ini kontrol edip hem de bu state'i güncelliyordu. Ayrıca, bir `useEffect` hook'u her `formData` değişikliğinde bu fonksiyonu çağırıyor, bu da bir sonsuz döngüye neden oluyordu.

### Çözüm Stratejisi
1. **Bağımlılıkları Optimize Etme**:
   ```javascript
   // ÖNCE
   const validateForm = useCallback((): boolean => {
     // ... kod ...
     const errorsChanged = JSON.stringify(errors) !== JSON.stringify(formErrors);
     if (errorsChanged) {
       setFormErrors(errors);
     }
     // ... kod ...
   }, [formData, formErrors, isFormValid]);

   // SONRA
   const validateForm = useCallback((forceUpdate = false): boolean => {
     // ... kod ...
     const errorKeysChanged = 
       Object.keys(errors).length !== Object.keys(formErrors).length ||
       Object.keys(errors).some(key => errors[key] !== formErrors[key]) ||
       Object.keys(formErrors).some(key => !(key in errors));
     
     if (errorKeysChanged || forceUpdate) {
       setFormErrors(errors);
     }
     // ... kod ...
   }, [formData, isFormValid]); // formErrors dependency'yi kaldırdık
   ```

2. **useEffect'i Optimize Etme**:
   ```javascript
   // ÖNCE
   useEffect(() => {
     validateForm();
   }, [formData, validateForm]);

   // SONRA
   useEffect(() => {
     const timeoutId = setTimeout(() => {
       validateForm();
     }, 50); // Gecikme ekleyerek peş peşe işlemleri engelleme
     
     return () => clearTimeout(timeoutId); // Temizleme fonksiyonu
   }, [formData]); // validateForm'u bağımlılıklardan çıkardık
   ```

### Teknik Açıklama
- `formErrors` bağımlılığı kaldırılarak sonsuz döngü engellendi
- Daha etkin karşılaştırma yapan bir algoritma kullanıldı
- Gecikme (setTimeout) ile peş peşe güncelleme döngüsü kırıldı
- Temizleme fonksiyonuyla bellek sızıntıları önlendi

## 2. NewPackageSaleModal.tsx'deki Filtreleme Sorunları

### Sorunun Tanımı
`customerSearch` ve `packageSearch` değiştiğinde filtreleme yapan `useEffect` hook'ları her render'da tetikleniyor ve gereksiz state güncellemelerine neden oluyordu.

### Çözüm Stratejisi
1. **Debounce ve Güvenli Güncelleme**:
   ```javascript
   // ÖNCE
   useEffect(() => {
     if (customerSearch.length > 0) {
       const filtered = customers.filter((customer) =>
         `${customer.name} ${customer.phone || ""}`
           .toLowerCase()
           .includes(customerSearch.toLowerCase())
       );
       setFilteredCustomers(filtered);
     } else {
       setFilteredCustomers([]);
     }
   }, [customerSearch, customers]);

   // SONRA
   useEffect(() => {
     // useRef kullanırsak daha iyi olurdu, ancak bu düzeltme için yeterli
     let isMounted = true;
     
     // Gecikme ile filtreleme yapalım
     const timeoutId = setTimeout(() => {
       if (!isMounted) return;
       
       if (customerSearch.length > 0) {
         const filtered = customers.filter((customer) => 
           `${customer.name} ${customer.phone || ""}`
             .toLowerCase()
             .includes(customerSearch.toLowerCase())
         );
         
         setFilteredCustomers(filtered);
       } else {
         setFilteredCustomers([]);
       }
     }, 50);
     
     return () => {
       isMounted = false;
       clearTimeout(timeoutId);
     };
   }, [customerSearch, customers]);
   ```

### Teknik Açıklama
- Gecikme (setTimeout) implementasyonu ile peş peşe filtrelemeleri engelledik
- İşlem sırasında bileşen unmount olduysa state güncellemesini engelleme
- Bellek sızıntılarını önlemek için temizleme fonksiyonu ekledik
- Aynı yaklaşımı `packageSearch` için de uyguladık

## 3. EditPackageSaleModal.tsx'deki Modal Kaynaklı Döngüler

### Sorunun Tanımı
`EditPackageSaleModal.tsx` dosyasında, modal her açıldığında form filtrelerini sıfırlayan ve diğer state'leri başlatan bir döngü vardı. Modal kapandığında state'ler sıfırlanıyor ve tekrar açıldığında yeniden oluşuyordu.

### Çözüm Stratejisi
1. **Modal Yaşam Döngüsünü Optimize Etme**:
   ```javascript
   // ÖNCE
   useEffect(() => {
     if (sale && open && !formInitialized.current) {
       setFormData({
         // ... form verilerini ayarlama ...
       });
       formInitialized.current = true;
     } else if (!open) {
       formInitialized.current = false;
       setIsCustomerEditable(false);
       setIsPackageEditable(false);
       setCustomerSearch("");
       setPackageSearch("");
       setFilteredCustomers([]);
       setFilteredPackages([]);
     }
   }, [sale, open]);

   // SONRA
   useEffect(() => {
     if (sale && open && !formInitialized.current) {
       // Modal yeni açıldığında tüm arama state'lerini temizle
       setCustomerSearch("");
       setPackageSearch("");
       
       setFormData({
         // ... form verilerini ayarlama ...
       });
       formInitialized.current = true;
     } else if (!open) {
       formInitialized.current = false;
       setIsCustomerEditable(false);
       setIsPackageEditable(false);
       // Filtreleme state'lerini burada güncellemiyoruz!
     }
   }, [open, sale]); // Bağımlılık sırasını değiştirdik
   ```

2. **Filtre ve Arama Fonksiyonlarını Debounce İle İyileştirme**:
   ```javascript
   // ÖNCE
   useEffect(() => {
     if (customerSearch && isCustomerEditable) {
       const filtered = customers.filter(/*...*/);
       setFilteredCustomers(filtered);
     } else {
       setFilteredCustomers([]);
     }
   }, [customerSearch, customers, isCustomerEditable]);

   // SONRA
   useEffect(() => {
     const timeoutId = setTimeout(() => {
       if (customerSearch && isCustomerEditable) {
         const filtered = customers.filter(/*...*/);
         setFilteredCustomers(filtered);
       } else {
         setFilteredCustomers([]);
       }
     }, 100); // 100ms debounce
     
     return () => clearTimeout(timeoutId);
   }, [customerSearch, customers, isCustomerEditable]);
   ```

### Teknik Açıklama
- Modal state'lerini daha etkili yönetme: Modal kapandığında tüm state'leri değil, sadece edit modlarını sıfırlıyoruz
- Filtreleme işlemlerini gecikme ile uygulama (debounce) 
- Kod içi yorum ve belgelendirme ile okunabilirliği artırma
- Sorumluluk ayrımı: Farklı görevleri farklı useEffect'lerde yönetiyoruz

## 4. usePackageSaleManagement ve usePackageSaleData Arasındaki Döngü

### Sorunun Tanımı
`usePackageSaleManagement.ts` içinde bir useEffect hook'u, `dataOps.fetchSales` fonksiyonunu bağımlılık olarak kullanıyor ve her değiştiğinde tekrar çağırıyordu. Bu da sonsuz bir döngüye neden oluyordu.

### Çözüm Stratejisi
1. **useRef ile Stable Fonksiyon Referansı Oluşturma**:
   ```javascript
   // useRef ve useEffect ekledik
   import { useEffect, useMemo, useRef } from 'react';
   
   // fetchSales için stable referans oluşturma
   const fetchSalesRef = useRef(dataOps.fetchSales);
   
   // fetchSales değiştiğinde ref'i güncelleme, ancak effect'i tetiklememe
   useEffect(() => {
     fetchSalesRef.current = dataOps.fetchSales;
   }, [dataOps.fetchSales]);
   
   // Sayfa veya filtre değiştiğinde veri yükleme 
   useEffect(() => {
     fetchSalesRef.current(uiState.currentPage, uiState.dateFilter);
   }, [uiState.currentPage, uiState.dateFilter]); // fetchSales bağımlılığı yok!
   ```

2. **usePackageSaleData'daki fetchSales Fonksiyonunu Optimize Etme**:
   ```javascript
   const fetchSales = useCallback(async (page, filter) => {
     // Geçerli filtre yoksa erken çık
     if (!filter.startDate || !filter.endDate) return;
     
     // Zaten yükleniyor durumdaysa, tekrar çağrılmasını engelle
     if (loading) return;
     
     try {
       setLoading(true);
       // ... geri kalan kod ...
     } catch (error) {
       // ... hata işleme ...
     } finally {
       setLoading(false);
     }
   }, [loading, listCache, showToasts]); // toast bağımlılığını kaldırdık
   ```

### Teknik Açıklama
- `useRef` kullanarak fonksiyon referanslarını stabilize ettik
- İki hook arasında dengeli bir etkileşim sağladık:
  1. İlk hook sadece güncel fonksiyon referansını takip ediyor (re-render tetiklemiyor)
  2. İkinci hook sadece sayfa veya filtre değiştiğinde çalışıyor
- Yükleme durum kontrolü ekleyerek çakışan istekleri önledik
- Gereksiz bağımlılıkları kaldırarak performans iyileştirmesi yaptık

## Genel İyileştirme İlkeleri

1. **Bağımlılık Listesi Optimizasyonu**: 
   - Gereksiz bağımlılıkları kaldır
   - Bağımlılık listesini küçük tut
   - Object/array bağımlılıkları memoize et

2. **State Güncelleme Optimizasyonu**:
   - Peş peşe state güncellemelerini önle (debounce)
   - Gereksiz state güncellemelerini filtrele (değişiklik varsa güncelle)
   - useRef kullanarak değişmeyen referanslar oluştur

3. **Bellek Yönetimi**:
   - Temizleme fonksiyonları ekle
   - Zamanlayıcıları (timer) temizle
   - Unmount durumunda state güncellemesini engelle

4. **Yaşam Döngüsü Yönetimi**:
   - Modal açılma/kapanma optimizasyonu
   - Veri yükleme ve form durumu işlemlerini ayır
   - İlk yükleme vs. güncellemeleri farklı şekillerde ele al

Bu ilkeler, React uygulamalarında performansı artırır, hataları azaltır ve kod kalitesini yükseltir. Her değişiklikte, nasıl çalıştığını açıklamak için yorumlar eklenmesi de gelecekteki geliştiricilere fayda sağlayacaktır.


------------


# React Uygulamasında Form Verisi İletim Sorunu Çözümü

## Tespit Edilen Sorun

Paket oluşturma işleminde, frontend arayüzünde "başarılı" mesajı alınmasına rağmen veritabanına kayıt yapılmıyordu. 

Sorunu incelediğimde veri akışındaki kopukluğu tespit ettim:

1. `PackageModal` bileşeni, form verilerini doğru şekilde topluyor ve `onSubmit` fonksiyonu aracılığıyla ana bileşene iletiyor.
2. Ana bileşendeki (PackagesPage) `onSubmit` handler'ı, bu verileri alıyor ve konsola "Form verileri alındı" mesajını yazdırıyor.
3. **Kritik Sorun Noktası**: Ana bileşen, bu verileri `setFormData` ile `usePackageManagement` hook'undaki state'e atmaya çalışıyor, ancak ardından hemen `handleCreatePackage` fonksiyonunu çağırıyor.
4. React'ın state güncellemelerinin asenkron yapısı nedeniyle, `handleCreatePackage` çağrıldığında `formData` state'i henüz güncellenmemiş oluyor.
5. Sonuç olarak, `handleCreatePackage` fonksiyonu boş form verileriyle çalışıyor ve boş veri doğrulamadan geçemediği için API çağrısı yapılmıyor.

Bu durum, konsol çıktısında açıkça görülüyor:

```
Form verileri alındı: {name: 'Klasi̇k Bakim Paketi', sessionCount: 5, price: 6, categoryId: 'cm8fh62pc0000mzoaljfjjfr3', serviceIds: Array(1)}

Form doğrulanıyor, mevcut veriler: {
  "name": "",
  "price": 0,
  "sessionCount": 1,
  "categoryId": "",
  "serviceIds": []
}

Form doğrulama sonucu: Geçersiz {...}
```

## Çözüm Yaklaşımı

React'teki bu state güncelleme gecikmesi ve senkronizasyon sorununu çözmek için üç yaklaşım düşündüm:

1. **State Güncellemesi ve Beklemesi**: `setFormData` sonrası bir gecikme (setTimeout) kullanıp ardından işlemi yapmak.
2. **Refs Kullanımı**: State yerine ref kullanarak anlık değer değişimi sağlamak.
3. **Doğrudan Parametre Aktarımı**: Form verilerini hook'taki state'e aktarmak yerine, doğrudan parametre olarak ileten yeni bir fonksiyon eklemek.

En pratik, etkili ve kodun genel mimari tasarımını bozmayan çözüm olarak üçüncü yaklaşımı seçtim.

## Uygulanan Çözüm

1. `usePackageManagement` hook'una yeni bir fonksiyon ekledim:

```typescript
const handleCreatePackageWithData = useCallback(async (packageData: PackageFormData): Promise<Package | null> => {
  // Giriş kontrolleri ve güvenlik kontrolleri...
  
  // Doğrudan gönderilen veriyi doğrula
  if (!validateForm(packageData)) {
    return null;
  }
  
  try {
    // İşlem yürütme kontrolü için flag
    operationInProgress.current = true;
    setLoading(true);
    
    // API çağrısı
    const newPackage = await createPackage(packageData, showToasts);
    
    // Önbelleği temizle ve listeyi güncelle
    invalidatePackageCache();
    await fetchPackages();
    
    return newPackage;
  } catch (error) {
    // Hata işleme...
  } finally {
    // Temizlik işlemleri...
  }
}, [/* bağımlılıklar */]);
```

2. Sonra bu fonksiyonu hook'un dönüş değerine ekledim:

```typescript
return {
  // Diğer değerler...
  operations: {
    // Diğer operasyonlar...
    handleCreatePackageWithData  // Yeni eklenen fonksiyon
  },
};
```

3. Son olarak, `PackagesPage` bileşeninde `onSubmit` handler'ını değiştirdim:

```typescript
onSubmit={async (formData) => {
  try {
    // Önceki versiyon:
    // setFormData(formData);           // State güncelleme (asenkron)
    // const result = await handleCreatePackage(); // Eski form verileri ile çalışır
    
    // Yeni versiyon:
    const result = await handleCreatePackageWithData(formData); // Doğrudan güncel veriler ile çalışır
    
    if (result) {
      // Başarılı işlem sonrası...
      setIsNewPackageOpen(false);
    }
  } catch (err) {
    // Hata işleme...
  }
}}
```

## Sonuç ve Öğrenilen Dersler

Bu çözüm, React'teki state güncellemelerinin asenkron doğasından kaynaklanan sorunları aşmak için etkili bir yaklaşım örneğidir. Öğrenilen dersler:

1. **State Güncellemeleri Asenkrondur**: React'ta `setState` çağrıları anlık değil, asenkron çalışır. Bu nedenle, hemen ardından state'e erişmek güncel değeri vermez.

2. **Veri Akışını Düşünün**: Bileşenler arası veri akışını tasarlarken, asenkron state güncellemelerini ve bunların etkilerini göz önünde bulundurun.

3. **Fonksiyonel Programlama Avantajı**: Doğrudan parametre alan fonksiyonlar, state değişimlerine bağımlılığı azaltarak daha öngörülebilir kod sağlar.

4. **Debuglama Önemlidir**: Konsol çıktılarının dikkatli analizi, bu tür sorunları tespit etmede kritik öneme sahiptir. Gördüğümüz gibi, "Form verileri alındı" ve "Form doğrulanıyor, mevcut veriler" çıktıları arasındaki tutarsızlık, sorunu hızlıca tespit etmemi sağladı.

Benzer bir sorunla karşılaşırsanız, öncelikle veri akışını takip edin ve asenkron state değişimlerinin etkilerini göz önünde bulundurun. Basit bir log eklemesi bile, bu tür sorunların tespitinde büyük fayda sağlayabilir.


-------------





PERSONELLER İÇİN YAPILANLAR 

farklı sayfalarda eskı versıyon kullanlarını bulursam su promptu gırecegım 

Merhaba Claude, projemizdeki sayfaları, yeni oluşturduğumuz dengeli personel yönetimi yapısına uygun şekilde güncellemek istiyorum. Aşağıdaki dosyayı inceleyip, eski personel yönetim kodlarını yeni yapıyla değiştirmene yardımcı olmanı rica ediyorum.

[GÜNCELLENECEK DOSYA İÇERİĞİNİ BURAYA YAPIŞTIRIN]

Lütfen dosyayı, aşağıdaki yeni dengeli yapıya göre güncelle:

1. ESKİ İMPORT YAPILARI:
   - import { createStaff, updateStaff, deleteStaff, updateStaffPermissions } from "@/lib/mcp/staff";
   - Doğrudan MCP API çağrıları (callMcpApi ile 'update-staff-permissions' gibi)
   - İzinler ve formatlama için inline kod

2. YENİ İMPORT YAPILARI:
   - import { createNewStaff, updateStaffInfo, updateStaffPermissionsService } from "@/services/staffService";
   - import { useStaffManagement } from "@/hooks/useStaffManagement";
   - import { formatPhoneNumber, formatNameCapitalize } from "@/utils/staff/formatters";
   - import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/utils/staff/permissions";

3. ESKİ KOD KULLANIMLARI:
   - Doğrudan API çağrıları: updateStaffPermissions(id, permissions)
   - Manuel izin yönetimi kodu
   - İç içe geçmiş doğrulama kontrolleri
   - Tekrarlanan formatlama kodu
   - "use client" direktifi eksikliği

4. YENİ KOD KULLANIMLARI:
   - useStaffManagement hook'u: const { staff, handleUpdatePermissions, handlePermissionSelection } = useStaffManagement();
   - Merkezi servis fonksiyonları: await updateStaffPermissionsService(id, permissions);
   - Formatlama yardımcıları: formatPhoneNumber(phone), formatNameCapitalize(name)
   - "use client" direktifi (client component'lerde)

Lütfen aşağıdakilere dikkat et:
- Client component'lere "use client" direktifi ekle
- Eski fonksiyonlar yerine services/staffService.ts içindeki yeni fonksiyonları kullan
- İzin yönetiminde useStaffManagement hook'unu kullan
- Eksik doğrulamaları ekle
- Telefon/isim formatlama için yardımcı fonksiyonları kullan
- Hata yönetimini iyileştir

Bu yeni yapı, backend (kritik doğrulamalar) ve frontend (kullanıcı arayüzü mantığı) arasında dengeli bir yaklaşım sağlıyor.

Teşekkürler!

------

# Dengeli Yaklaşım: Backend vs Frontend Mantık Dağılımı

## İçindekiler
- [Genel Bakış](#genel-bakış)
- [Mantık İşlemlerinin Dağılımı](#mantık-i̇şlemlerinin-dağılımı)
- [Backend'de Yapılan Değişiklikler](#backendde-yapılan-değişiklikler)
- [Frontend'de Yapılan Değişiklikler](#frontendde-yapılan-değişiklikler)
- [Dosya Yapısı](#dosya-yapısı)
- [Uygulamanın Avantajları](#uygulamanın-avantajları)
- [Örnek Kullanımlar](#örnek-kullanımlar)
- [Gelecek Geliştirmeler](#gelecek-geliştirmeler)

## Genel Bakış

Bu proje, işletme yönetim sistemimizdeki personel (staff) modülü için mantık işlemlerini backend ve frontend arasında dengeli bir şekilde dağıtan bir yaklaşım uygulamaktadır. Amaç, güvenlik ve veri tutarlılığı için kritik doğrulamaları backend'de yaparken, kullanıcı deneyimini iyileştiren doğrulamaları ve gösterimleri frontend'de gerçekleştirmektir.

Yaklaşımımız üç temel prensibe dayanmaktadır:
1. **Kritik iş mantığı ve doğrulamaları** her zaman backend'de yapılmalıdır (güvenlik için)
2. **Kullanıcı arayüzü mantığı ve gösterimi** frontend'de yapılmalıdır (kullanıcı deneyimi için)
3. **Bazı doğrulamalar** hem backend hem de frontend'de yapılmalıdır (hem güvenlik hem kullanıcı deneyimi için)

## Mantık İşlemlerinin Dağılımı

### Backend'de Yapılan İşlemler:
- **Kritik İzin Doğrulamaları:**
  - Rol bazlı izin filtreleme (örn. STAFF rolü ADMIN izinlerine sahip olamaz)
  - Bağımlı izinlerin otomatik eklenmesi (örn. EDIT_SERVICE izni verildiğinde VIEW_SERVICES otomatik eklenir)
  - Tehlikeli izin kombinasyonlarının engellenmesi
  - İzin geçerliliğinin kontrolü

- **Çalışma Saati Doğrulamaları:**
  - Format kontrolü
  - Bitiş saatinin başlangıç saatinden sonra olmasının kontrolü
  - Çakışma kontrolü

- **Veri Tutarlılığı ve Güvenlik:**
  - Veri bütünlüğünün sağlanması
  - İlişkisel veri kontrolü
  - Yetkilendirme kontrolleri

### Frontend'de Yapılan İşlemler:
- **Gösterim Mantığı:**
  - İzinlerin modüllere göre gruplandırması
  - Kullanıcı dostu isimlerle izinlerin gösterilmesi
  - Rollere göre filtreleme

- **Etkileşim Mantığı:**
  - İzin seçimi sırasında bağımlı izinlerin otomatik seçilmesi
  - Anlık kullanıcı geribildirimi sağlama
  - İzin çakışmaları için uyarılar

- **Veri Formatlaması:**
  - Telefon numarası formatlaması
  - İsim formatlaması
  - Tarih/saat gösterimi

### Her İki Tarafta da Yapılan İşlemler:
- **Form Alanı Doğrulamaları:** 
  - Frontend: Anlık geri bildirim için
  - Backend: Güvenlik için son savunma hattı olarak

- **Veri Tutarlılık Kontrolleri:**
  - Frontend: Kullanıcıyı yönlendirmek için
  - Backend: Veri bütünlüğünü garanti etmek için

## Backend'de Yapılan Değişiklikler

### 1. İzin Yönetimi Geliştirmeleri
```typescript
// src/app/mcp-tools/staff/index.ts içinde:

// İzin sabitlerini ekleme
const ROLE_PERMISSION_LIMITS = {
  ADMIN: ['*'], // Admin tüm izinlere sahip olabilir
  MANAGER: ['VIEW_*', 'ADD_*', 'EDIT_*', ...],
  STAFF: ['VIEW_SERVICES', 'VIEW_CUSTOMERS', ...],
  CASHIER: ['VIEW_SERVICES', 'VIEW_CUSTOMERS', ...]
};

// İzin bağımlılıklarını ekleme
const PERMISSION_DEPENDENCIES = {
  'ADD_SERVICE': ['VIEW_SERVICES'],
  'EDIT_SERVICE': ['VIEW_SERVICES'],
  // ...diğer bağımlılıklar
};

// Tehlikeli izin kombinasyonlarını ekleme
const DANGEROUS_PERMISSION_COMBINATIONS = [
  { 
    check: (perms) => perms.includes('EDIT_PAYMENTS') && !perms.includes('VIEW_PAYMENTS'), 
    message: 'Ödeme düzenleme yetkisi için görüntüleme yetkisi gereklidir' 
  },
  // ...diğer kombinasyonlar
];
```

### 2. updateStaffPermissions Fonksiyonu Geliştirilmesi
```typescript
// İzin doğrulama işlemi - Backend tarafında kritik doğrulama
validatePermissions(permissions, role) {
  // 1. Rol bazlı doğrulama
  // 2. Eksik bağımlılıkları ekleme
  // 3. Tehlikeli izin kombinasyonlarını kontrol etme
  // ...
}

// Personel izinlerini güncelleme fonksiyonu
async updateStaffPermissions(id, permissions) {
  // Personeli getir
  const staff = await prisma.staff.findUnique({...});
  
  // İzin doğrulaması yap
  const validationResult = this.validatePermissions(permissions, staff.accountType);
  if (!validationResult.valid) {
    return { success: false, error: validationResult.message };
  }
  
  // Doğrulanmış izinleri güncelle
  const updatedStaff = await prisma.staff.update({...});
  // ...
}
```

### 3. Çalışma Saati Doğrulama
```typescript
validateWorkingHours(workingHours) {
  // Temel format kontrolü
  // Gerekli alanların kontrolü (gün, başlangıç saati, bitiş saati)
  // Saat kontrolü - bitiş saati başlangıç saatinden sonra olmalı
  // Aynı gün içinde çakışma kontrolü
  // ...
}
```

### 4. Yeni MCP Araçları Ekleme
```typescript
// Çalışma saati doğrulama aracı
server.tool(
  'validate-working-hours',
  { workingHours: z.array(z.any()) },
  async ({ workingHours }) => {
    const validation = staffTools.validateWorkingHours(workingHours);
    return { success: validation.valid, message: validation.message, data: validation.workingHours };
  }
);

// İzin doğrulama aracı
server.tool(
  'validate-permissions',
  { permissions: z.array(z.string()), role: z.string() },
  async ({ permissions, role }) => {
    const validation = staffTools.validatePermissions(permissions, role);
    return { success: validation.valid, message: validation.message, data: validation.permissions };
  }
);
```

## Frontend'de Yapılan Değişiklikler

### 1. Modüler Yapı Oluşturma
```
/src/services/staffService.ts - Kompleks iş mantığı
/src/utils/staff/formatters.ts - Yardımcı formatlamalar
/src/utils/staff/permissions.ts - İzin yardımcıları
/src/hooks/useStaffManagement.ts - React hook'ları
```

### 2. Yardımcı Fonksiyonlar
```typescript
// src/utils/staff/formatters.ts içinde:

// Telefon numarası formatlama
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  // (5XX) XXX XX XX formatında telefon
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
}

// İsim formatlaması
export function formatNameCapitalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

### 3. İzin Yönetimi Yardımcıları
```typescript
// src/utils/staff/permissions.ts içinde:

// İzin gruplarını tanımlama
export const PERMISSION_GROUPS = {
  Hizmetler: ["VIEW_SERVICES", "ADD_SERVICE_CATEGORY", "EDIT_SERVICE", ...],
  "Personel Yönetimi": ["VIEW_STAFF", "EDIT_STAFF", "DELETE_STAFF"],
  // ...diğer gruplar
};

// Kullanıcı dostu izin etiketleri
export const PERMISSION_LABELS: Record<Permission, string> = {
  VIEW_SERVICES: "Hizmetler Sayfasını Görebilir",
  ADD_SERVICE_CATEGORY: "Hizmet Kategorisi Ekleyebilir",
  // ...diğer etiketler
};

// Sanal ve gerçek izinleri dönüştürme
export function preparePermissionsForUI(permissions: Permission[]) {
  // Gerçek izinlerden sanal izinleri oluşturma
  // ...
}
```

### 4. Personel Yönetim Hook'u
```typescript
// src/hooks/useStaffManagement.ts içinde:

export function useStaffManagement() {
  // ...state ve API çağrıları...
  
  // İzin Yönetimi
  const handlePermissionSelection = (permission, currentPermissions, onPermissionsChange) => {
    // İzin mantığı...
  };
  
  const handleTogglePermissionGroup = (permissions, currentPermissions, onPermissionsChange) => {
    // Grup izin mantığı...
  };
  
  // Diğer yardımcı fonksiyonlar...
  
  return {
    staff,
    loading,
    error,
    fetchStaff,
    handleUpdatePermissions,
    syncPermissionsWithRole,
    validateStaffWorkingHours,
    handlePermissionSelection,
    handleTogglePermissionGroup,
    preparePermissionsForUI
  };
}
```

### 5. Merkezi Servis Fonksiyonları
```typescript
// src/services/staffService.ts içinde:

// İzin doğrulama
export async function validatePermissions(permissions: Permission[], role: string) {
  try {
    // Backend doğrulaması yap
    const result = await callMcpApi('validate-permissions', { permissions, role });
    // ...
  } catch (error) {
    // Hata işleme
  }
}

// Çalışma saati doğrulama
export async function validateWorkingHours(workingHours: any[]) {
  try {
    // Backend API ile çalışma saatlerini doğrulat
    const result = await callMcpApi('validate-working-hours', { workingHours });
    // ...
  } catch (error) {
    // Hata işleme
  }
}

// Yeni personel ekleme
export async function createNewStaff(staffData: any) {
  try {
    // Telefon formatla
    if (staffData.phone) {
      staffData.phone = formatPhoneNumber(staffData.phone);
    }
    // İsim formatla
    if (staffData.name) {
      staffData.name = formatNameCapitalize(staffData.name);
    }
    // Personeli kaydet
    const result = await callMcpApi('create-staff', staffData);
    // ...
  } catch (error) {
    // Hata işleme
  }
}
```

## Dosya Yapısı

```
/src
  /app
    /mcp-tools
      /staff
        index.ts         # Backend MCP araçları (API)
  /components
    /staff
      PermissionsModal.tsx   # İzin yönetim modalı
      NewStaffModal.tsx      # Personel ekleme modalı
    PhoneInput.tsx           # Telefon giriş bileşeni
  /services
    staffService.ts      # Merkezi personel servisi
  /utils
    /staff
      formatters.ts      # Formatlama yardımcıları
      permissions.ts     # İzin yardımcıları
  /hooks
    useStaffManagement.ts    # Personel yönetim hook'u
  /lib
    /mcp
      /staff
        index.ts         # MCP API çağrıları
```

## Uygulamanın Avantajları

1. **Güvenlik**
   - Kritik doğrulamalar backend'de yapılarak güvenlik arttırıldı
   - İzin yönetimindeki boşluklar kapatıldı
   - Tehlikeli izin kombinasyonları engellendi

2. **Kullanıcı Deneyimi**
   - Anında geribildirim sağlanarak kullanıcı deneyimi iyileştirildi
   - İzin seçiminde otomatik bağımlılık yönetimi ile kullanım kolaylaştırıldı 
   - Sezgisel kullanıcı arayüzü (kategori bazlı izinler, etiketler)

3. **Kod Kalitesi**
   - Tekrarlayan kodlar azaltıldı
   - Mantık merkezi yerlerde toplandı
   - Test edilebilirlik arttırıldı

4. **Bakım Kolaylığı**
   - Modüler yapı sayesinde değişiklikler izole edildi
   - Dosya yapısı daha organize hale getirildi
   - Frontend ve backend arasındaki sorumluluklar net şekilde ayrıldı

## Örnek Kullanımlar

### İzin Yönetimi Örneği

```tsx
// PermissionsModal.tsx içinde merkezi yapının kullanımı

// Hooks ve yardımcıları import et
import { useStaffManagement } from "@/hooks/useStaffManagement";
import { PERMISSION_GROUPS, PERMISSION_LABELS } from "@/utils/staff/permissions";
import { updateStaffPermissionsService } from "@/services/staffService";

// Component içinde:
const { 
  handlePermissionSelection, 
  handleTogglePermissionGroup,
  preparePermissionsForUI 
} = useStaffManagement();

// İzinleri hazırla
useEffect(() => {
  if (staff?.permissions) {
    const allPermissions = new Set(preparePermissionsForUI(staff.permissions));
    setSelectedPermissions(allPermissions);
  }
}, [staff, preparePermissionsForUI]);

// İzin seçimini işle
const handleTogglePermission = (permission: Permission) => {
  handlePermissionSelection(
    permission,
    Array.from(selectedPermissions),
    (updatedPermissions) => setSelectedPermissions(new Set(updatedPermissions))
  );
};

// İzinleri kaydet
const handleSave = async () => {
  try {
    await updateStaffPermissionsService(
      staff.id, 
      Array.from(selectedPermissions) as Permission[]
    );
    // ...
  } catch (error) {
    // Hata işle
  }
};
```

### Personel Ekleme Örneği

```tsx
// NewStaffModal.tsx içinde

// İlgili yardımcı modülleri import et
import { useStaffManagement } from "@/hooks/useStaffManagement";
import { formatPhoneNumber, formatNameCapitalize } from "@/utils/staff/formatters";
import { validateWorkingHours, createNewStaff } from "@/services/staffService";

// Hook'u kullan
const { validateStaffWorkingHours } = useStaffManagement();

// Çalışma saatlerini doğrula
const validateWorkingHoursData = async () => {
  if (!formData.workingHours.length) return true;
  
  const result = await validateStaffWorkingHours(formData.workingHours);
  if (!result.valid) {
    setError(result.message);
    return false;
  }
  return true;
};

// Personel oluştur
const handleSubmit = async () => {
  try {
    // Temel doğrulama
    if (!validateForm()) return;
    
    // Çalışma saati doğrulama
    const isWorkingHoursValid = await validateWorkingHoursData();
    if (!isWorkingHoursValid) return;
    
    // Verileri hazırla ve gönder
    const staffData = { /*...*/ };
    await createNewStaff(staffData);
    
    // Başarılı sonuç işle
  } catch (error) {
    // Hata işle
  }
};
```

## Gelecek Geliştirmeler

1. **Kapsamı Genişletme**
   - Aynı dengeli yaklaşımı diğer modüllere (randevular, müşteriler, vb.) uygulayabiliriz
   - API yanıt formatlarını daha fazla standardize edebiliriz

2. **Güvenlik İyileştirmeleri**
   - Veri doğrulama katmanlarını daha da geliştirebiliriz
   - İzin kontrollerini daha detaylı hale getirebiliriz

3. **Kullanıcı Deneyimi**
   - Toplu izin yönetimi için arayüz ekleyebiliriz
   - İzin şablonları oluşturabiliriz
   - Çalışma saati görselleştirmelerini geliştirebiliriz

4. **Teknik İyileştirmeler**
   - End-to-end testler ekleyebiliriz
   - Tip güvenliğini daha da artırabiliriz
   - Performans optimizasyonları yapabiliriz

5. **Dokümantasyon**
   - İzin sistemi için kapsamlı dokümantasyon oluşturabiliriz
   - Kullanıcı rehberleri ekleyebiliriz

Bu README, dengeli yaklaşımın temel prensiplerini ve uygulamasını anlatmak için oluşturulmuştur. Bu prensipleri diğer modüllere de uyguladığınızda, daha sağlam, güvenli ve kullanıcı dostu bir sistem elde etmiş olacaksınız.




*****


MÜŞTERİLER İÇİN YAPILANLAR


--- bir sorunla karşılarsınsa öncelikle şu promptu gir; 

# Müşteri Modülü Sorunlarını Çözme İçin Prompt Şablonu

Müşteri modülü ile ilgili sorunlarda Claude'a en etkili şekilde soru sormak için aşağıdaki şablonu kullanabilirsiniz:

```
Claude, müşteri modülü ile ilgili bir sorun yaşıyorum. Bu modül, dengeli yaklaşımla 3 katmanlı bir yapıda organize edilmiş durumda:

1. /utils/customer/formatters.ts - Formatlama ve veri doğrulama yardımcıları
2. /services/customerService.ts - Backend API entegrasyonu ve iş mantığı
3. /hooks/useCustomerManagement.ts - UI state ve bileşen mantığı

[SORUNUN ÖZETİ BURAYA]

Sorunla ilgili detaylar:
- Hangi sayfada/bileşende sorun oluşuyor: [SAYFA/BİLEŞEN ADI]
- Hata mesajı (varsa): [HATA MESAJI]
- Beklenen davranış: [BEKLENTİ]
- Gözlemlenen davranış: [GÖZLEM]

Lütfen şu dosyaları incele ve sorunu çözmeme yardımcı ol:
1. [İNCELENMESİ GEREKEN DOSYA YOLU]
2. [İNCELENMESİ GEREKEN DOSYA YOLU]

Dengeli yaklaşıma uygun kalarak bu sorunu nasıl çözebiliriz? İş mantığı değişiklikleri customerService.ts'de, formatlama değişiklikleri formatters.ts'de ve UI mantığı değişiklikleri useCustomerManagement.ts'de yapılmalıdır.
```

## Örnek Prompt Kullanımları

### Örnek 1: Telefon Formatı Sorunu

```
Claude, müşteri modülü ile ilgili bir sorun yaşıyorum. Bu modül, dengeli yaklaşımla 3 katmanlı bir yapıda organize edilmiş durumda:

1. /utils/customer/formatters.ts - Formatlama ve veri doğrulama yardımcıları
2. /services/customerService.ts - Backend API entegrasyonu ve iş mantığı  
3. /hooks/useCustomerManagement.ts - UI state ve bileşen mantığı

Müşteri eklerken veya düzenlerken telefon numaraları doğru formatta görüntülenmiyor. Telefon numarası veritabanına doğru kaydediliyor ancak formda (5XX) XXX XX XX formatında gösterilmiyor.

Sorunla ilgili detaylar:
- Hangi sayfada/bileşende sorun oluşuyor: NewCustomerModal ve EditCustomerModal
- Hata mesajı (varsa): Yok, sadece format sorunu
- Beklenen davranış: Telefon numaralarının (5XX) XXX XX XX formatında görüntülenmesi
- Gözlemlenen davranış: Telefon numaraları 5XXXXXXXXXX formatında görüntüleniyor

Lütfen şu dosyaları incele ve sorunu çözmeme yardımcı ol:
1. /src/utils/customer/formatters.ts
2. /src/components/customers/NewCustomerModal.tsx
3. /src/components/PhoneInput.tsx

Dengeli yaklaşıma uygun kalarak bu sorunu nasıl çözebiliriz? İş mantığı değişiklikleri customerService.ts'de, formatlama değişiklikleri formatters.ts'de ve UI mantığı değişiklikleri useCustomerManagement.ts'de yapılmalıdır.
```

### Örnek 2: Müşteri Silme Sorunu

```
Claude, müşteri modülü ile ilgili bir sorun yaşıyorum. Bu modül, dengeli yaklaşımla 3 katmanlı bir yapıda organize edilmiş durumda:

1. /utils/customer/formatters.ts - Formatlama ve veri doğrulama yardımcıları
2. /services/customerService.ts - Backend API entegrasyonu ve iş mantığı
3. /hooks/useCustomerManagement.ts - UI state ve bileşen mantığı

Müşterileri silmeye çalıştığımda yetkim olmasına rağmen bir hata alıyorum ve müşteriler silinmiyor.

Sorunla ilgili detaylar:
- Hangi sayfada/bileşende sorun oluşuyor: Customers sayfası
- Hata mesajı (varsa): "Yetkisiz İşlem: Müşteri silme yetkiniz bulunmamaktadır"
- Beklenen davranış: Admin kullanıcısı olarak müşterileri silebilmem
- Gözlemlenen davranış: Silme butonu görünüyor ancak tıkladığımda yetki hatası alıyorum

Lütfen şu dosyaları incele ve sorunu çözmeme yardımcı ol:
1. /src/hooks/useCustomerManagement.ts
2. /src/hooks/usePermissions.ts
3. /src/app/(protected)/customers/page.tsx

Dengeli yaklaşıma uygun kalarak bu sorunu nasıl çözebiliriz? İş mantığı değişiklikleri customerService.ts'de, formatlama değişiklikleri formatters.ts'de ve UI mantığı değişiklikleri useCustomerManagement.ts'de yapılmalıdır.
```

### Örnek 3: Yeni Özellik Ekleme İsteği

```
Claude, müşteri modülüne yeni bir özellik eklemek istiyorum. Bu modül, dengeli yaklaşımla 3 katmanlı bir yapıda organize edilmiş durumda:

1. /utils/customer/formatters.ts - Formatlama ve veri doğrulama yardımcıları
2. /services/customerService.ts - Backend API entegrasyonu ve iş mantığı
3. /hooks/useCustomerManagement.ts - UI state ve bileşen mantığı

Müşterileri etiketleme (tagging) özelliği eklemek istiyorum. Her müşteriye birden fazla etiket eklenebilmeli (örn: "VIP", "Yeni", "Düzenli", "Takipte" gibi) ve bu etiketlere göre filtreleme yapılabilmeli.

Gereksinim detayları:
- Her müşteriye birden fazla etiket eklenebilmeli
- Etiketler renkli olarak gösterilmeli
- Etiketlere göre filtreleme yapılabilmeli
- Etiketler önceden tanımlanmış bir listeden seçilmeli
- Sistem yöneticileri yeni etiketler ekleyebilmeli

Lütfen şu dosyaları incele:
1. /src/services/customerService.ts
2. /src/hooks/useCustomerManagement.ts
3. /src/app/(protected)/customers/page.tsx

Dengeli yaklaşıma uygun kalarak bu özelliği nasıl ekleyebiliriz? İş mantığı değişiklikleri customerService.ts'de, formatlama değişiklikleri formatters.ts'de ve UI mantığı değişiklikleri useCustomerManagement.ts'de yapılmalıdır.
```

## Prompt Hazırlarken Dikkat Edilecek Noktalar

1. **Katmanlı Yapıyı Hatırlat**: Üç katmanlı yapıyı her zaman başta belirt.
2. **Sorun/İstek Detayları**: Problemi veya özellik isteğini açıkça tanımla.
3. **Hangi Bileşen**: Sorunun tam olarak nerede olduğunu belirt.
4. **Beklenti ve Gözlem**: Beklediğin ve gözlemlediğin davranışı karşılaştır.
5. **İlgili Dosyaları Listele**: Claude'un incelemesi için en kritik dosyaları belirt.
6. **Dengeli Yaklaşım Hatırlatması**: Son kısımda değişikliklerin doğru katmanda yapılması gerektiğini hatırlat.

Bu şekilde prompt hazırlayarak, Claude'un müşteri modülünün yapısını anlayarak soruna odaklanmasını ve dengeli yaklaşıma uygun çözümler üretmesini sağlayabilirsiniz.


# Dengeli Yaklaşımla Modül Yeniden Yapılandırma Kılavuzu

Bu kılavuz, dengeli bir yaklaşımla modülleri yeniden yapılandırma sürecini açıklar. Müşteri (Customer) modülü üzerinde gerçekleştirdiğimiz refaktör çalışması temel alınarak hazırlanmıştır.

## İçindekiler

1. [Dengeli Yaklaşım Nedir?](#dengeli-yaklaşım-nedir)
2. [Dosya Yapısı ve Sorumluluklar](#dosya-yapısı-ve-sorumluluklar)
3. [Uygulama Adımları](#uygulama-adımları)
4. [Örnek Yapılar ve Kodlar](#örnek-yapılar-ve-kodlar)
5. [Diğer Modüllere Uygulama](#diğer-modüllere-uygulama)
6. [En İyi Uygulamalar](#en-i̇yi-uygulamalar)
7. [Hata Noktaları ve Kaçınılması Gerekenler](#hata-noktaları-ve-kaçınılması-gerekenler)

## Dengeli Yaklaşım Nedir?

Dengeli yaklaşım, uygulama mantığının farklı katmanlara net bir şekilde ayrılmasını sağlayan bir yazılım mimarisi yaklaşımıdır. Bu yaklaşımda:

- **Backend ve Frontend arasında sorumluluklar dengeli dağıtılır**
- Her katmanın belirli ve iyi tanımlanmış sorumlulukları vardır
- Kod tekrarı azaltılır ve bakım kolaylaştırılır
- Test edilebilirlik artırılır

### Temel Prensipler

1. **Backend'de Yapılacak İşlemler**:
   - Veri bütünlüğü doğrulamaları
   - Tekil kayıt kontrolü
   - Veri tabanı işlemleri
   - İlişkisel veri yönetimi

2. **Frontend'de Yapılacak İşlemler**:
   - Veri formatlaması
   - Anında (inline) form doğrulama
   - UI mantığı ve kullanıcı deneyimi
   - Yerel state yönetimi

3. **Her İki Tarafta Yapılan Doğrulamalar**:
   - Frontend: Kullanıcı deneyimi için anında doğrulama
   - Backend: Veri bütünlüğü için kesin doğrulama

## Dosya Yapısı ve Sorumluluklar

Dengeli yaklaşım uygulanırken her modül için şu üç katman oluşturulur:

```
/src/
  ├── utils/
  │   └── [module]/
  │       └── formatters.ts     # Veri formatlamaları
  ├── services/
  │   └── [module]Service.ts    # API entegrasyonu ve iş mantığı
  └── hooks/
      └── use[Module].ts        # React hook'ları ve UI mantığı
```

### 1. Formatlayıcılar (`/utils/[module]/formatters.ts`)

**Sorumluluklar**:
- Veri formatlaması (isim, telefon, tarih vb.)
- Veri doğrulama yardımcıları
- Standartlaştırma fonksiyonları

**Örnek**:
```typescript
// /src/utils/customer/formatters.ts
export const formatCustomerName = (name: string) => {...};
export const formatPhoneNumber = (phone: string) => {...};
export const isValidPhoneNumber = (phone: string) => {...};
```

### 2. Servis Katmanı (`/services/[module]Service.ts`)

**Sorumluluklar**:
- MCP API entegrasyonu
- Veri doğrulama ve işleme
- Hata yakalama ve işleme
- Tip tanımlamaları

**Örnek**:
```typescript
// /src/services/customerService.ts
export const getCustomers = async () => {...};
export const createCustomer = async (data) => {...};
export const validateCustomerData = (data) => {...};
```

### 3. React Hook'ları (`/hooks/use[Module].ts`)

**Sorumluluklar**:
- UI state yönetimi
- Form mantığı
- Yükleme ve hata durumları
- Yetkilendirme entegrasyonu

**Örnek**:
```typescript
// /src/hooks/useCustomerManagement.ts
export const useCustomerManagement = (options) => {
  const [customers, setCustomers] = useState([]);
  // ...diğer state ve logic kodları
  return { customers, loading, error, /* diğer değerler */ };
};
```

## Uygulama Adımları

Bir modülü dengeli yaklaşımla yeniden yapılandırmak için şu adımları izleyin:

### 1. Mevcut Kodu Analiz Edin

- Modüldeki tüm veri işleme ve formatlamaları belirleyin
- İş mantığı kodlarını tespit edin
- UI mantığı ve state yönetimini belirleyin
- Tekrarlanan kodu işaretleyin

### 2. Formatleyicileri Ayırın

- `/utils/[module]/formatters.ts` dosyası oluşturun
- Formatlamaya ilişkin tüm kodu buraya taşıyın
- Veri doğrulama yardımcılarını ekleyin

### 3. Servis Katmanını Oluşturun

- `/services/[module]Service.ts` dosyası oluşturun
- API çağrılarını taşıyın
- Tüm tip tanımlamalarını ekleyin
- İş mantığı doğrulamalarını buraya ekleyin

### 4. React Hook'unu Geliştirin

- `/hooks/use[Module].ts` dosyası oluşturun
- Bileşenlerdeki state işlemlerini buraya taşıyın
- UI mantığı fonksiyonlarını ekleyin
- Servis katmanı fonksiyonlarını çağırın

### 5. Bileşenleri Güncelleyin

- Mevcut bileşenleri, yeni hook'u kullanacak şekilde güncelleyin
- Doğrudan API çağrılarını kaldırın
- Formatleyiciler yerine ilgili yeni fonksiyonları kullanın

### 6. Eski Kodu Temizleyin

- Kullanılmayan kodları kaldırın
- Eski API çağrılarını düşürülmüş (deprecated) olarak işaretleyin
- Gereksiz dosyaları temizleyin

## Örnek Yapılar ve Kodlar

### Formatleyici Örneği

```typescript
// /src/utils/customer/formatters.ts
/**
 * Müşteri adını formatlar (Her kelimenin ilk harfi büyük)
 */
export const formatCustomerName = (name: string): string => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Telefon numarasını formatlar
 * (5XX) XXX XX XX formatında
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length !== 10) return phoneNumber;
  
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
};

/**
 * Telefon numarasının geçerli olup olmadığını kontrol eder
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length === 10 && cleaned.startsWith('5');
};
```

### Servis Katmanı Örneği

```typescript
// /src/services/customerService.ts
import { callMcpApi } from '@/lib/mcp/helpers';
import { formatCustomerName, normalizePhoneNumber } from '@/utils/customer/formatters';

// Tip tanımlamaları
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // ...diğer alanlar
}

export interface CreateCustomerParams {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

/**
 * Tüm müşterileri getiren fonksiyon
 */
export const getCustomers = async (
  includeDeleted: boolean = false, 
  showToast: boolean = false
): Promise<Customer[]> => {
  try {
    const response = await callMcpApi('get-customers', { includeDeleted }, {
      showToast,
      customErrorMsg: 'Müşteri listesi alınamadı'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Müşteri listesi alınamadı');
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Müşteri listesi alınırken hata:', error);
    throw error;
  }
};

/**
 * Yeni müşteri oluşturan fonksiyon
 */
export const createCustomer = async (
  data: CreateCustomerParams, 
  showToast: boolean = false
): Promise<Customer> => {
  try {
    // Verileri formatla
    const formattedData = {
      name: formatCustomerName(data.name),
      phone: normalizePhoneNumber(data.phone),
      email: data.email?.trim() || undefined,
      notes: data.notes?.trim() || undefined
    };
    
    // İş mantığı doğrulaması
    validateCustomerData(formattedData);
    
    // API çağrısı
    const response = await callMcpApi('create-customer', formattedData, {
      showToast,
      customErrorMsg: 'Müşteri oluşturulamadı'
    });
    
    if (!response.success) {
      // Özelleştirilmiş hata işleme
      if (response.existingCustomer) {
        const customError = new Error(response.error || 'Bu telefon numarası ile kayıtlı müşteri bulunmaktadır');
        (customError as any).existingCustomer = response.existingCustomer;
        throw customError;
      }
      
      throw new Error(response.error || 'Müşteri oluşturulamadı');
    }
    
    return response.data;
  } catch (error) {
    console.error('Müşteri oluşturulurken hata:', error);
    throw error;
  }
};

/**
 * Veri doğrulama fonksiyonu
 */
export const validateCustomerData = (data: CreateCustomerParams): void => {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Müşteri adı gereklidir');
  }
  
  const phone = data.phone.replace(/\D/g, '');
  if (!phone || phone.length !== 10) {
    throw new Error('Geçerli bir telefon numarası gereklidir (10 haneli)');
  }
  
  if (!phone.startsWith('5')) {
    throw new Error('Telefon numarası 5 ile başlamalıdır');
  }
};
```

### React Hook Örneği

```typescript
// /src/hooks/useCustomerManagement.ts
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Customer,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '@/services/customerService';
import { isValidPhoneNumber, isValidEmail } from '@/utils/customer/formatters';

/**
 * Müşteri yönetimi hook'u
 */
export const useCustomerManagement = ({
  initialCustomers = [],
  autoFetch = true,
  showToasts = true
} = {}) => {
  // State
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  
  // Yardımcı hook'lar
  const { toast } = useToast();
  const {
    canViewCustomers,
    canAddCustomers,
    canEditCustomers,
    canDeleteCustomers
  } = usePermissions();
  
  /**
   * Tüm müşterileri getirir
   */
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getCustomers(false, showToasts);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      setError('Müşteriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [showToasts]);
  
  /**
   * Yeni müşteri oluşturur
   */
  const handleCreateCustomer = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newCustomer = await createCustomer(formData, showToasts);
      
      // Müşteri listesini güncelle
      await fetchCustomers();
      
      return newCustomer;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Müşteri oluşturulurken bir hata oluştu');
      return null;
    } finally {
      setLoading(false);
    }
  }, [formData, showToasts, fetchCustomers]);
  
  // İlk yükleme
  useEffect(() => {
    if (autoFetch) {
      fetchCustomers();
    }
  }, [autoFetch, fetchCustomers]);
  
  // Diğer fonksiyonlar...
  
  return {
    // State
    customers,
    loading,
    error,
    
    // Form state
    formData,
    setFormData,
    
    // Operasyonlar
    fetchCustomers,
    handleCreateCustomer,
    
    // Yetkilendirme
    permissions: {
      canView: canViewCustomers,
      canAdd: canAddCustomers,
      canEdit: canEditCustomers,
      canDelete: canDeleteCustomers
    }
    
    // ... diğer değerler
  };
};

export default useCustomerManagement;
```

## Diğer Modüllere Uygulama

Dengeli yaklaşımı diğer modüllere (hizmetler, ürünler, randevular vb.) uygulamak için:

1. Önce mevcut yapıyı analiz edin
2. Modül için gerekli formatlama işlevlerini belirleyin
3. Servis katmanında bulunması gereken API çağrılarını tespit edin
4. UI bileşenlerinde tekrar eden mantığı belirleyin
5. Yukarıdaki adımları takip ederek ilgili dosyaları oluşturun
6. Yeni yapıyı bileşenlerde entegre edin

Şu modüller için benzer bir yaklaşım uygulayabilirsiniz:
- Services (Hizmetler)
- Products (Ürünler)
- Appointments (Randevular)
- Packages (Paketler)
- Package Sales (Paket Satışları)
- Payments (Ödemeler)

## En İyi Uygulamalar

1. **Tip Tanımlamalarını Merkezi Tutun**:
   - Tüm tip tanımlamaları servis katmanında olmalı
   - Formatleyiciler ve hook'lar bu tipleri içe aktarmalı

2. **Fonksiyon İsim Standartları**:
   - Formatleyiciler: `formatX`, `isValidX`, `normalizeX`
   - Servis fonksiyonları: `getX`, `createX`, `updateX`, `deleteX`
   - Hook fonksiyonları: `handleX` (kullanıcı etkileşimi), `fetchX` (veri getirme)

3. **Geriye Dönük Uyumluluk**:
   - Eski API fonksiyonlarını aniden kaldırmak yerine `@deprecated` işaretiyle işaretleyin
   - Eski koddan yenisine yönlendirici fonksiyonlar ekleyin

4. **Merkezi Hata Yönetimi**:
   - Hataları servis katmanında yakalayın ve gerekirse yeniden fırlatın
   - Hook'larda kullanıcı arayüzü için hataları işleyin

5. **Yetkilendirme Kontrollerini Merkezi Tutun**:
   - Bileşenlerde tekrar eden yetki kontrolleri yerine hook'ta yönetin

## Hata Noktaları ve Kaçınılması Gerekenler

1. **İş Mantığını Bileşenlerde Tutmak**:
   - İş mantığı, bileşenlerde değil servis katmanında olmalıdır
   - Bileşenler sadece UI mantığı içermelidir

2. **Aynı Kodu Tekrarlamak**:
   - Benzer formatlama ve doğrulama kodunu farklı yerlerde tekrarlamaktan kaçının
   - Tekrarlı kod varsa, formatleyicilere taşıyın

3. **Doğrulama Güvensizliği**:
   - Frontend doğrulamasına asla tamamen güvenmeyin
   - Kritik doğrulamaları her zaman backend'de de yapın

4. **Bağımlılığı Arttırmak**:
   - Bir katmanın başka bir katmana çok bağımlı olması bakımı zorlaştırır
   - Katmanlar arasındaki bağımlılığı açık ve net tutun

5. **Aşırı Mühendislik**:
   - Gereksiz soyutlama katmanları oluşturmaktan kaçının
   - Uygulamanızın ihtiyaçlarına göre yaklaşımı ölçeklendirin

---

Bu kılavuz, dengeli yaklaşımla modül yeniden yapılandırma konusunda size rehberlik edecektir. Her modülün kendine özgü gereksinimleri olabileceğini unutmayın ve buradaki prensipleri kendi ihtiyaçlarınıza göre uyarlayın.



HİZMETLER İÇİN bir sorunlar karşılaşırsak önce şu prompt u gir 

----

# Hizmet Modülü Sorunlarını Çözme İçin Prompt Şablonu

Hizmet modülüyle ilgili bir sorunla karşılaştığınızda Claude'a aşağıdaki gibi bir prompt gönderebilirsiniz:

```
Claude, hizmet modülünde bir sorunla karşılaştım. Bu modül, dengeli yaklaşımla 3 katmanlı bir yapıda organize edilmiş durumda:

1. /utils/service/formatters.ts - Formatlama ve doğrulama yardımcıları
2. /services/serviceService.ts - Backend API entegrasyonu ve iş mantığı
3. /hooks/useServiceManagement.ts - UI state ve bileşen mantığı

[SORUNUN ÖZETİ BURAYA]

Sorunla ilgili detaylar:
- Hangi sayfa/bileşende sorun oluşuyor: [SAYFA/BİLEŞEN ADI]
- Hata mesajı (varsa): [HATA MESAJI]
- Beklenen davranış: [BEKLENTİ]
- Gözlemlenen davranış: [GÖZLEM]

Lütfen şu dosyaları incele ve sorunu çözmeme yardımcı ol:
1. [İNCELENMESİ GEREKEN DOSYA YOLU]
2. [İNCELENMESİ GEREKEN DOSYA YOLU]

Dengeli yaklaşıma uygun kalarak bu sorunu nasıl çözebiliriz? İş mantığı değişiklikleri serviceService.ts'de, formatlama değişiklikleri formatters.ts'de ve UI mantığı değişiklikleri useServiceManagement.ts'de yapılmalıdır.
```

## Örnek Prompt Kullanımları

### Örnek 1: Fiyat Formatlama Sorunu

```
Claude, hizmet modülünde bir sorunla karşılaştım. Bu modül, dengeli yaklaşımla 3 katmanlı bir yapıda organize edilmiş durumda:

1. /utils/service/formatters.ts - Formatlama ve doğrulama yardımcıları
2. /services/serviceService.ts - Backend API entegrasyonu ve iş mantığı
3. /hooks/useServiceManagement.ts - UI state ve bileşen mantığı

Hizmet fiyatları TL sembolüyle doğru formatta görüntülenmiyor. Bazı fiyatlar doğru formatlanırken, bazıları formatlanmadan gösteriliyor.

Sorunla ilgili detaylar:
- Hangi sayfa/bileşende sorun oluşuyor: Services sayfası ve HizmetListesi bileşeni
- Hata mesajı (varsa): Yok, sadece görüntüleme sorunu
- Beklenen davranış: Tüm fiyatların "1.235,00 ₺" formatında gösterilmesi
- Gözlemlenen davranış: Bazı fiyatlar "1235" şeklinde formatsız görüntüleniyor

Lütfen şu dosyaları incele ve sorunu çözmeme yardımcı ol:
1. /src/utils/service/formatters.ts
2. /src/app/(protected)/services/page.tsx
3. /src/hooks/useServiceManagement.ts

Dengeli yaklaşıma uygun kalarak bu sorunu nasıl çözebiliriz? İş mantığı değişiklikleri serviceService.ts'de, formatlama değişiklikleri formatters.ts'de ve UI mantığı değişiklikleri useServiceManagement.ts'de yapılmalıdır.
```

### Örnek 2: Kategori Seçme Sorunu

```
Claude, hizmet modülünde bir sorunla karşılaştım. Bu modül, dengeli yaklaşımla 3 katmanlı bir yapıda organize edilmiş durumda:

1. /utils/service/formatters.ts - Formatlama ve doğrulama yardımcıları
2. /services/serviceService.ts - Backend API entegrasyonu ve iş mantığı
3. /hooks/useServiceManagement.ts - UI state ve bileşen mantığı

Yeni hizmet eklerken kategoriler dropdown'ında kategoriler yüklenmiyor ve bu yüzden hizmet ekleyemiyorum.

Sorunla ilgili detaylar:
- Hangi sayfa/bileşende sorun oluşuyor: NewServiceModal bileşeni
- Hata mesajı (varsa): Konsolda "Cannot read properties of undefined (reading 'map')" hatası
- Beklenen davranış: Kategoriler dropdown'ında tüm hizmet kategorilerinin listelenmesi
- Gözlemlenen davranış: Dropdown boş kalıyor ve kategori seçilemediği için kayıt düğmesi devre dışı kalıyor

Lütfen şu dosyaları incele ve sorunu çözmeme yardımcı ol:
1. /src/components/services/NewServiceModal.tsx
2. /src/hooks/useServiceManagement.ts
3. /src/services/serviceService.ts

Dengeli yaklaşıma uygun kalarak bu sorunu nasıl çözebiliriz? İş mantığı değişiklikleri serviceService.ts'de, formatlama değişiklikleri formatters.ts'de ve UI mantığı değişiklikleri useServiceManagement.ts'de yapılmalıdır.
```

### Örnek 3: Filtreleme Sorunu

```
Claude, hizmet modülünde bir sorunla karşılaştım. Bu modül, dengeli yaklaşımla 3 katmanlı bir yapıda organize edilmiş durumda:

1. /utils/service/formatters.ts - Formatlama ve doğrulama yardımcıları
2. /services/serviceService.ts - Backend API entegrasyonu ve iş mantığı
3. /hooks/useServiceManagement.ts - UI state ve bileşen mantığı

Hizmetler sayfasında filtreleme işlemi doğru çalışmıyor. Kategori veya durum seçtiğimde hizmetler filtrelenmiyor.

Sorunla ilgili detaylar:
- Hangi sayfa/bileşende sorun oluşuyor: Services sayfası ve filtreleme kontrollerinde
- Hata mesajı (varsa): Hata mesajı yok
- Beklenen davranış: Kategori veya durum (aktif/pasif) filtresi seçildiğinde listenin filtrelenmesi
- Gözlemlenen davranış: Filtreler değiştiğinde liste güncellenmiyor, tüm hizmetler gösterilmeye devam ediyor

Lütfen şu dosyaları incele ve sorunu çözmeme yardımcı ol:
1. /src/app/(protected)/services/page.tsx
2. /src/hooks/useServiceManagement.ts
3. /src/services/serviceService.ts

Dengeli yaklaşıma uygun kalarak bu sorunu nasıl çözebiliriz? İş mantığı değişiklikleri serviceService.ts'de, formatlama değişiklikleri formatters.ts'de ve UI mantığı değişiklikleri useServiceManagement.ts'de yapılmalıdır.
```

## Prompt Hazırlarken Dikkat Edilecek Noktalar

1. **Katmanlı Yapıyı Hatırlat**: Her zaman 3 katmanlı yapıyı başta belirtin
2. **Sorun Açıklaması**: Problemi net ve kısa bir şekilde tanımlayın
3. **Detaylar Bölümü**: Sorunun nerede ve nasıl ortaya çıktığını detaylandırın
4. **Dosya Listesi**: Claude'un incelemesi gereken en önemli dosyaları belirtin
5. **Dengeli Yaklaşıma Vurgu**: Çözümün dengeli yapıya uygun olması gerektiğini hatırlatın

Bu şablonu kullanarak hizmetler modülüyle ilgili karşılaştığınız sorunları Claude'a daha etkili bir şekilde iletebilir ve daha doğru çözümler alabilirsiniz.


----





# Merkezi ve Dengeli Yapı Kullanım Kılavuzu

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Dengeli Yaklaşım Nedir?](#dengeli-yaklaşım-nedir)
3. [Dosya Yapısı](#dosya-yapısı)
4. [Katmanların Sorumlulukları](#katmanların-sorumlulukları)
5. [Modül Dönüştürme Adımları](#modül-dönüştürme-adımları)
6. [Örnek Kullanım](#örnek-kullanım)
7. [Eski Koddan Geçiş](#eski-koddan-geçiş)
8. [Yaygın Sorunlar ve Çözümleri](#yaygın-sorunlar-ve-çözümleri)

## Genel Bakış

Bu kılavuz, projemizdeki modüllerin (hizmetler, personel, müşteriler vb.) merkezi ve dengeli bir yapıya nasıl dönüştürüleceğini anlatmaktadır. Şu ana kadar personel, müşteri ve hizmetler modüllerinde uygulanmış olan bu yapı, kod tekrarını azaltmakta, bakımı kolaylaştırmakta ve test edilebilirliği artırmaktadır.

## Dengeli Yaklaşım Nedir?

Dengeli yaklaşım, uygulama mantığının farklı sorumluluk katmanlarına ayrılmasını sağlayan bir yazılım mimarisi prensibidir. Bu yaklaşımda:

1. **Backend ve Frontend arasında dengeli sorumluluk dağılımı** sağlanır
2. **Formatlama ve doğrulama işlemleri** merkezi hale getirilir
3. **API entegrasyonu** tek bir servis katmanında toplanır
4. **UI mantığı** React hook'ları aracılığıyla yönetilir

Bu yapıyla şu faydaları elde ediyoruz:
- Kod tekrarının azaltılması
- Daha tutarlı kullanıcı deneyimi
- Daha kolay hata ayıklama
- Daha hızlı geliştirme

## Dosya Yapısı

Her modül için üç temel katmanda dosyalar oluşturuyoruz:

```
/src/
  ├── utils/
  │   └── [module]/
  │       └── formatters.ts     # Veri formatlamaları ve doğrulamaları
  ├── services/
  │   └── [module]Service.ts    # API entegrasyonu ve iş mantığı
  └── hooks/
      └── use[Module].ts        # React hook'ları ve UI mantığı
```

Örneğin, hizmetler modülü için:
```
/src/
  ├── utils/
  │   └── service/
  │       └── formatters.ts     # Hizmet formatlamaları
  ├── services/
  │   └── serviceService.ts     # Hizmet API entegrasyonu
  └── hooks/
      └── useServiceManagement.ts  # Hizmet UI mantığı
```

## Katmanların Sorumlulukları

### 1. Formatlama Katmanı (`/utils/[module]/formatters.ts`)

- Veri formatlaması (TL, tarih, telefon numarası vb.)
- Veri doğrulama yardımcıları
- Format dönüştürme işlemleri

**Örnek:**

```typescript
// /src/utils/service/formatters.ts
export const formatServicePrice = (price: number): string => {
  return price.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  });
};

export const isValidServiceName = (name: string): boolean => {
  return !!name && typeof name === 'string' && name.trim().length >= 2;
};
```

### 2. Servis Katmanı (`/services/[module]Service.ts`)

- API çağrıları
- MCP entegrasyonu
- Tip tanımlamaları
- Veri doğrulama
- Hata işleme

**Örnek:**

```typescript
// /src/services/serviceService.ts
import { callMcpApi } from '@/lib/mcp/helpers';
import { formatServiceName } from '@/utils/service/formatters';

export interface Service {
  id: string;
  name: string;
  // ...diğer özellikler
}

export const getServices = async (
  filters?: ServiceFilterOptions
): Promise<Service[]> => {
  try {
    const response = await callMcpApi('get-services', filters || {});
    
    if (!response.success) {
      throw new Error(response.error || 'Hizmetler alınamadı');
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Hizmetler alınırken hata:', error);
    throw error;
  }
};
```

### 3. Hook Katmanı (`/hooks/use[Module].ts`)

- UI state yönetimi
- Form işlemleri
- Filtreleme
- Kullanıcı etkileşimleri
- Servis katmanı entegrasyonu

**Örnek:**

```typescript
// /src/hooks/useServiceManagement.ts
export const useServiceManagement = (options = {}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getServices();
      setServices(data);
    } catch (error) {
      // Hata işleme
    } finally {
      setLoading(false);
    }
  }, []);
  
  // ...diğer fonksiyonlar
  
  return {
    services,
    loading,
    fetchServices,
    // ...diğer değerler
  };
};
```

## Modül Dönüştürme Adımları

Mevcut bir modülü merkezi ve dengeli yapıya dönüştürmek için izlenmesi gereken adımlar:

1. **Analiz**:
   - Mevcut kodlardaki tekrarlanan formatlama/doğrulama işlemlerini tespit edin
   - API çağrılarını belirleyin
   - UI mantığını ve state yönetimini belirleyin

2. **Dosya Yapısı Oluşturma**:
   - `utils/[module]/formatters.ts` dosyasını oluşturun
   - `services/[module]Service.ts` dosyasını oluşturun
   - `hooks/use[Module].ts` dosyasını oluşturun

3. **Kodu Yeni Yapıya Taşıma**:
   - Formatlamaları `formatters.ts` dosyasına taşıyın
   - API çağrılarını `[module]Service.ts` dosyasına taşıyın
   - UI mantığını `use[Module].ts` hook'una taşıyın

4. **Bileşenleri Güncelleme**:
   - Eski API çağrılarını yeni servis fonksiyonlarıyla değiştirin
   - Eski formatlama kodlarını yeni formatlayıcılarla değiştirin
   - Eski state yönetimini hook kullanımıyla değiştirin

5. **Eski Kodları İşaretleme**:
   - Artık kullanılmayan eski dosyaları `@deprecated` olarak işaretleyin
   - Yeni yapıya yönlendiren bir mesaj ekleyin

## Örnek Kullanım

### Yeni Yapının Bileşenlerde Kullanımı

```tsx
// Bir bileşende hook'u kullanma
import { useServiceManagement } from '@/hooks/useServiceManagement';
import { formatServicePrice } from '@/utils/service/formatters';

function ServiceList() {
  const { 
    services, 
    loading, 
    handleCreateService, 
    handleDeleteService 
  } = useServiceManagement();
  
  return (
    <div>
      {services.map(service => (
        <div key={service.id}>
          <h3>{service.name}</h3>
          <p>Fiyat: {formatServicePrice(service.price)}</p>
          <button onClick={() => handleDeleteService(service.id)}>Sil</button>
        </div>
      ))}
    </div>
  );
}
```

### Servis Fonksiyonlarını Doğrudan Kullanma

```tsx
import { getServiceById } from '@/services/serviceService';

async function loadServiceDetails(id: string) {
  try {
    const service = await getServiceById(id);
    // İşlem yap...
  } catch (error) {
    // Hata işle...
  }
}
```

## Eski Koddan Geçiş

Eski kodu yeni yapıya geçirmek için izlenmesi gereken adımlar:

### 1. İmport Yollarını Değiştirme

```typescript
// ESKİ
import { fetchServicesMcp } from "@/lib/mcp/services";
import { fetchServiceCategoriesMcp } from "@/lib/mcp/services";

// YENİ
import { getServices, getServiceCategories } from "@/services/serviceService";
```

### 2. API Çağrılarını Değiştirme

```typescript
// ESKİ
const response = await fetchServicesMcp();
if (response.success) {
  const services = response.data;
}

// YENİ
try {
  const services = await getServices();
  // İşlem yap...
} catch (error) {
  // Hata işle...
}
```

### 3. Formatlama İşlemlerini Değiştirme

```typescript
// ESKİ
const formattedPrice = `${price.toLocaleString('tr-TR')} TL`;

// YENİ
import { formatServicePrice } from '@/utils/service/formatters';
const formattedPrice = formatServicePrice(price);
```

### 4. State Yönetimini Hook'a Taşıma

```tsx
// ESKİ
const [services, setServices] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    setLoading(true);
    const response = await fetchServicesMcp();
    if (response.success) {
      setServices(response.data);
    }
    setLoading(false);
  }
  fetchData();
}, []);

// YENİ
const { services, loading, fetchServices } = useServiceManagement();

useEffect(() => {
  fetchServices();
}, [fetchServices]);
```

## Yaygın Sorunlar ve Çözümleri

### 1. API Hataları

**Sorun**: Servis çağrıları hata fırlatıyor.

**Çözüm**: 
- `try/catch` bloklarının doğru kullanıldığından emin olun
- Servis katmanında hataların doğru şekilde ele alındığından emin olun
- Konsolda tüm hataları loglamayı unutmayın

### 2. Veri Formatlaması Sorunları

**Sorun**: Veriler doğru formatta görüntülenmiyor.

**Çözüm**:
- Formatlama fonksiyonlarının doğru parametrelerle çağrıldığından emin olun
- Null/undefined durumlarının ele alındığından emin olun
- Formatlama fonksiyonlarını ayrı ayrı test edin

### 3. Hook Bağımlılıkları

**Sorun**: Hook'lar gereksiz yere yeniden çalışıyor veya hiç çalışmıyor.

**Çözüm**:
- `useCallback` ve `useMemo` kullanımını gözden geçirin
- Bağımlılık dizilerinin doğru tanımlandığından emin olun
- React DevTools ile yeniden render'ları izleyin

### 4. Type Hataları

**Sorun**: TypeScript hataları alıyorsunuz.

**Çözüm**:
- Tüm tip tanımlamalarının servis katmanında yapıldığından emin olun
- İmport edilen tiplerin doğru olduğunu kontrol edin
- Tiplerin kapsamlı ve doğru tanımlandığından emin olun

---

Bu kılavuz, projemizdeki modülleri merkezi ve dengeli bir yapıya dönüştürmek için referans olarak kullanılabilir. Herhangi bir sorunuz veya öneriniz varsa, ekip liderinizle iletişime geçebilirsiniz.





-------paketler--------



# PAKETLER MODÜLÜ MERKEZİ SİSTEM UYGULAMASI README

## İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Uygulanan Dengeli Yaklaşım](#uygulanan-dengeli-yaklaşım)
3. [Oluşturulan Dosyalar](#oluşturulan-dosyalar)
4. [Yapılan Değişiklikler](#yapılan-değişiklikler)
5. [Veri Akışı](#veri-akışı)
6. [Elde Edilen Faydalar](#elde-edilen-faydalar)
7. [Bilinen Sorunlar ve Çözümleri](#bilinen-sorunlar-ve-çözümleri)

## Genel Bakış

Paketler modülü için dengeli yaklaşım mimarisi uygulanmıştır. Bu yaklaşım, kodun daha modüler, bakımı kolay ve tutarlı olmasını sağlar. Uygulanan yapı, diğer modüllerde (personel, müşteri, hizmetler) kullanılan dengeli yaklaşımla uyumludur.

## Uygulanan Dengeli Yaklaşım

Dengeli yaklaşım, üç ana katmandan oluşur:

1. **Formatlama Katmanı** (`/utils/package/formatters.ts`):
   - Veri formatlaması ve doğrulaması
   - UI için yardımcı fonksiyonlar
   - Doğrulama işlevleri

2. **Servis Katmanı** (`/services/packageService.ts`):
   - Backend API entegrasyonu
   - MCP API çağrıları
   - İş mantığı ve veri işleme
   - Hata yönetimi

3. **Hook Katmanı** (`/hooks/usePackageManagement.ts`):
   - UI durum yönetimi
   - Kullanıcı etkileşim mantığı 
   - Yetkilendirme kontrolleri
   - Servis çağrılarını yönetme

## Oluşturulan Dosyalar

```
/src/
  ├── utils/
  │   └── package/
  │       └── formatters.ts     # Formatlama ve doğrulama işlevleri
  ├── services/
  │   └── packageService.ts     # API entegrasyonu ve iş mantığı
  └── hooks/
      └── usePackageManagement.ts  # UI mantığı ve durum yönetimi
```

## Yapılan Değişiklikler

### 1. Formatters.ts

Paket verilerinin formatlama işlemleri için merkezi bir yer oluşturuldu:

```typescript
// Paket fiyatını para birimi formatına dönüştürür
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(price);
};

// Seans sayısını formatlı gösterir
export const formatSessionCount = (count: number): string => {
  return `${count} Seans`;
};

// Diğer formatlama ve doğrulama işlevleri...
```

### 2. PackageService.ts

Tüm API çağrıları merkezi bir servis katmanına taşındı:

```typescript
export const getPackages = async (
  includeInactive: boolean = false, 
  showToast: boolean = false
): Promise<PackageWithServices[]> => {
  try {
    const response = await callMcpApi('get-packages', { includeInactive }, {
      showToast,
      customErrorMsg: 'Paket listesi alınamadı'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Paket listesi alınamadı');
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Paket listesi alınırken hata:', error);
    throw error;
  }
};

// Diğer API çağrıları (createPackage, updatePackage, deletePackage vb.)
```

### 3. usePackageManagement.ts

UI mantığı ve durum yönetimi için hook oluşturuldu:

```typescript
export const usePackageManagement = ({
  initialPackages = [],
  autoFetch = true,
  showToasts = true
}: UsePackageManagementProps = {}): UsePackageManagementResult => {
  // State tanımlamaları
  const [packages, setPackages] = useState<PackageWithServices[]>(initialPackages);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  // Diğer state'ler...
  
  // Operasyonlar
  const fetchPackages = useCallback(async () => {
    // Paketleri getirme işlemleri...
  }, [permissions.canView, showToasts, toast]);
  
  const handleCreatePackage = useCallback(async () => {
    // Paket oluşturma işlemleri...
  }, [permissions.canAdd, formData, showToasts, toast, fetchPackages]);
  
  // Diğer işlemler (handleUpdatePackage, handleDeletePackage vb.)
  
  return {
    // Döndürülecek değerler ve işlevler
    packages,
    loading,
    error,
    permissions,
    fetchPackages,
    handleCreatePackage,
    handleUpdatePackage,
    handleDeletePackage,
    // Diğer değerler ve işlevler
  };
};
```

### 4. Bileşen Güncellemeleri

Paketler sayfası ve ilgili bileşenler, yeni merkezi yapıyı kullanacak şekilde güncellendi:

```typescript
// packages/page.tsx içinde
const {
  packages,
  loading,
  error,
  permissions,
  fetchPackages,
  handleDeletePackage,
  handleUpdatePackage,
  groupByCategory
} = usePackageManagement({ autoFetch: true, showToasts: true });

// PackageListItem.tsx içinde
import { formatPrice, formatSessionCount } from '@/utils/package/formatters';

// Formatlı fiyat ve seans sayısı gösterimi:
<div className="text-sm font-medium">{formatPrice(pkg.price)}</div>
<div className="text-sm text-gray-600">{formatSessionCount(pkg.sessionCount)}</div>
```

## Veri Akışı

Dengeli yaklaşım mimarisinde veri akışı şu şekildedir:

1. **Kullanıcı Etkileşimi**:
   - Kullanıcı UI'da bir eylem gerçekleştirir (paket ekle, düzenle, sil)

2. **Hook Yönetimi**:
   - `usePackageManagement` hook'u kullanıcı eylemini işler
   - Yetki kontrolü yapar
   - İlgili state'leri günceller

3. **Servis Çağrısı**:
   - Hook, paketService fonksiyonunu çağırır
   - Servis, MCP API'ye istek gönderir

4. **UI Güncellemesi**:
   - API yanıtını aldıktan sonra hook state'i günceller
   - UI otomatik olarak yeni verilerle yenilenir

## Elde Edilen Faydalar

1. **Kod Tekrarının Azalması**:
   - Formatlama ve API çağrıları tek bir yerden yönetiliyor
   - Bileşenler arasında aynı kodu tekrar yazmak yerine hook kullanılıyor

2. **Daha İyi Hata Yönetimi**:
   - Hatalar merkezi bir şekilde ele alınıyor
   - Kullanıcı dostu hata mesajları

3. **Tutarlılık**:
   - Tüm paket işlemleri aynı formatlama ve doğrulama kurallarını kullanıyor
   - Diğer modüllerle (müşteri, personel, hizmetler) aynı mimari yapı

4. **Bakım Kolaylığı**:
   - API değişiklikleri sadece servis katmanında yapılması yeterli
   - UI değişiklikleri hook mantığını etkilemez

5. **Test Edilebilirlik**:
   - Her katman ayrı ayrı test edilebilir
   - Mock'lama daha kolay

## Bilinen Sorunlar ve Çözümleri

### Sorun: Yeni Paket Oluşturma Sorunu

**Semptom**: Paket oluşturma başarılı mesajı gösterilip veritabanına kaydedilmiyor.

**Sorun**: `handleUpdatePackage('new')` fonksiyonu çağrılıyor ancak bu fonksiyon yeni paket oluşturmak için tasarlanmamış.

**Çözüm**: Doğru fonksiyonu çağırmak ve form verilerini doğru şekilde iletmek:

```typescript
// packages/page.tsx içinde

<PackageModal
  isOpen={isNewPackageOpen}
  onClose={() => setIsNewPackageOpen(false)}
  onSubmit={async (formData) => {
    try {
      // Form verilerini state'e ata
      setFormData(formData);
      
      // Doğru fonksiyonu çağır
      const result = await handleCreatePackage();
      
      if (result) {
        toast({
          title: "Başarılı",
          description: "Paket başarıyla oluşturuldu",
        });
        
        await fetchPackages();
      }
    } catch (err) {
      // Hata işleme...
    }
  }}
  packageData={null}
  fetchPackages={fetchPackages}
/>
```

---

Bu README, paketler modülüne uygulanan merkezi sistem güncellemelerini özetlemektedir. Benzer yapı diğer modüllere de (müşteriler, hizmetler, personel) uygulanmıştır.

Çeviriye odaklandı ve Türkçe açıklama hazırladı.
1s

Paketler Modülü İyileştirmeleri
Paketler modülünde aşağıdaki geliştirmeleri gerçekleştirdim:

1. Veri Doğrulama Tutarlılığı
formatters.ts içinde merkezi bir validatePackageDataWithMessages doğrulama fonksiyonu oluşturdum
packageService.ts dosyasını bu merkezi doğrulama fonksiyonunu kullanacak şekilde güncelledim
Tüm modülde doğrulama mantığının tekrarlanmasını önledim
Hata mesajlarının tutarlı olmasını sağladım
2. Performans İyileştirmeleri
React'in useMemo ve useCallback hook'larını kullanarak gereksiz yeniden render'ları önledim
Paketlerin kategoriye göre gruplandırılması işlemini optimize ettim ve sonuçları önbelleğe aldım
Form işlemleri için performans iyileştirmeleri yaptım
useRef kullanarak state güncellemelerinin sayısını azalttım
3. Hook API Basitleştirme
usePackageManagement hook'unu mantıksal gruplara ayırdım:
state: Paketler, kategoriler, servisler ve temel durum değişkenleri
form: Form verileri, doğrulama, hatalar ve form işlemleri
operations: CRUD işlemleri (ekleme, güncelleme, silme)
helpers: Yardımcı fonksiyonlar ve araçlar
permissions: Kullanıcı yetkileri
Daha düzenli ve kolay kullanılabilir bir API yapısı oluşturdum
Tip güvenliğini artırdım
4. Modal Geliştirme
Modal bileşeninde useState yerine daha verimli olan useRef kullanarak veri yönetimini iyileştirdim
Form işleme fonksiyonlarını useCallback ile optimize ettim
Tekrarlanan kod bloklarını refactor ettim
Modal içindeki form etkileşimlerini daha hızlı ve verimli hale getirdim
5. Önbelleğe Alma Mekanizması
Paket verilerini önbelleğe almak için kapsamlı bir sistem geliştirdim (packageCache.ts)
Önbellek yönetimi için özel bir hook (usePackageCache) oluşturdum
Sık değişmeyen veriler (kategoriler, servisler) için otomatik önbellekleme ekledim
Önbellek geçerlilik süresi ve temizleme mekanizmaları ekledim
API çağrılarının sayısını azaltarak performansı artırdım
6. Yükleme Durumu Yönetimi
Daha ayrıntılı yükleme durumu takibi için bir sistem ekledim (LoadingState enum)
Her paket işlemi için ayrı yükleme durumu izleme mekanizması oluşturdum
Kullanıcıya daha iyi geri bildirim vermek için spesifik yükleme göstergeleri ekledim
Silme ve güncelleme işlemleri sırasında ilgili butonlarda yükleme animasyonları ekledim
Sonuç
Bu geliştirmeler, paketler modülünün:

Daha hızlı ve performanslı çalışmasını
Daha az API çağrısı yaparak sunucu yükünü azaltmasını
Daha iyi hata yönetimi ve kullanıcı geri bildirimi sağlamasını
Kod bakımının daha kolay olmasını
Genişletilebilirliğin artmasını
sağlamıştır. Tüm değişiklikler, istenen merkezi dengeli sistem yaklaşımını koruyarak ve güçlendirerek yapılmıştır.

Ayrıca, yapılan tüm değişiklikleri ve iyileştirmeleri detaylı olarak açıklayan bir dökümantasyon dosyası (PACKAGES-MODULE-IMPROVEMENTS.md) oluşturdum.



----paket satışları-----

# PAKET SATIŞLARI MODÜLÜ MERKEZİ SİSTEM UYGULAMASI (Devam)

## Yeni Özellikler ve İyileştirmeler

Paket satışları modülünün dengeli yapıya geçirilmesiyle birlikte, aşağıdaki yeni özellikler ve iyileştirmeler de eklendi:

1. **Gelişmiş Formatlama**:
   - Para birimi formatlaması (`formatPrice`)
   - Tarih formatlaması (`formatDate`)
   - Tarih-saat formatlaması (`formatDateTime`)
   - Ödeme yöntemi metinlerinin formatlanması (`getPaymentTypeText`, `getPaymentMethodText`)

2. **Gelişmiş Veri İşleme**:
   - Toplam tahsilat hesaplama (`calculateTotalReceived`)
   - Kalan tutar hesaplama (`calculateRemainingAmount`)
   - Tamamlanan seans sayısı hesaplama (`countCompletedSessions`)
   - Locale özel ISO tarih formatı (`toLocalISOString`)

3. **Gelişmiş Doğrulama**:
   - Paket satışı veri doğrulama (`validateSaleData`)
   - Ödeme veri doğrulama (`validatePaymentData`)
   - Satış nesnesi doğrulama ve normalizasyon (`validateSale`)

## Etkilenen Bileşenler

Paket satışları modülündeki aşağıdaki bileşenler, dengeli yapı kullanacak şekilde güncellenmiştir veya güncellenecektir:

1. **PackageSalesClient.tsx**:
   - Merkezi hook kullanacak şekilde tamamen yeniden yapılandırıldı
   - Doğrudan API çağrıları kaldırıldı
   - Formatlama işlemleri merkezi formatleyicilere taşındı

2. **PaymentsModal.tsx** (planlanan değişiklik):
   - Ödeme işlemleri için merkezi servisleri kullanacak şekilde güncellenecek
   - Formatlama işlemleri merkezi formatleyicilere taşınacak

3. **NewPackageSaleModal.tsx** (planlanan değişiklik):
   - Yeni paket satışı oluşturmada merkezi servisleri kullanacak
   - Doğrulama işlemleri formatleyiciler üzerinden yapılacak

4. **EditPackageSaleModal.tsx** (planlanan değişiklik):
   - Paket satışı güncellemede merkezi servisleri kullanacak
   - Doğrulama ve formatlama işlemleri merkezi yapı üzerinden sağlanacak

## Geliştirme ve Genişletme Önerileri

Paket satışları modülü için gelecekteki geliştirmeler:

1. **Performans Optimizasyonu**:
   - Veri önbelleğe alma (caching) eklenebilir
   - Pagination geliştirmeleri yapılabilir
   - Sanal liste (virtualized list) uygulanabilir

2. **Gelişmiş Filtreleme**:
   - Personel bazlı filtreleme
   - Müşteri bazlı filtreleme
   - Tutar aralığına göre filtreleme
   - Ödeme durumuna göre filtreleme (ödenmemiş, kısmen ödenmiş, tamamen ödenmiş)

3. **Raporlama Özellikleri**:
   - Paket satışı raporları
   - Ödeme raporları
   - İstatistiksel grafikler
   - Trend analizleri

4. **Kullanıcı Deneyimi İyileştirmeleri**:
   - Sürükle-bırak etkileşimleri
   - Toplu işlem yetenekleri
   - İptal ve geri ödeme işlemleri
   - Entegre SMS/e-posta bildirimleri

## Mimari Değişiklikler

Paket satışları modülü için dengeli yaklaşım, modülün mimarisinde şu temel değişiklikleri getirmiştir:

1. **Tek Yönlü Veri Akışı**:
   - Component → Hook → Service → API

2. **İlişki Değişiklikleri**:
   - Bileşenler artık doğrudan API'ye bağlı değil
   - Formatlamalar artık bileşenlerde değil, merkezi helpers'larda
   - Doğrulamalar merkezi katmanlarda

3. **Sorumluluk Ayrımı**:
   - UI bileşenleri: Sadece görüntüleme ve etkileşim
   - Hook'lar: State yönetimi ve kullanıcı etkileşimleri
   - Servisler: İş mantığı ve API entegrasyonu
   - Formatleyiciler: Veri doğrulama ve formatlama

## Entegrasyon Süreci

Bu modülün dengeli yapıya geçirilmesi, aşağıdaki adımlarla gerçekleştirilmiştir:

1. **Yeni Yapı Oluşturma**:
   - `/utils/packageSale/formatters.ts` oluşturuldu
   - `/services/packageSaleService.ts` oluşturuldu
   - `/hooks/usePackageSaleManagement.ts` oluşturuldu

2. **Mevcut Kodlardan Taşıma**:
   - Formatlama kodları formatleyici katmanına taşındı
   - API çağrıları servis katmanına taşındı
   - UI mantığı hook katmanına taşındı

3. **Bileşen Güncellemesi**:
   - `PackageSalesClient.tsx` yeni yapıyı kullanacak şekilde güncellendi

4. **Eski Dosyaların Korunması**:
   - `PackageSalesClient.tsx.backup` oluşturuldu
   - Tüm eski kodlar güvenli bir şekilde yedeklendi

## Sorun Giderme

Paket satışları modülünde dengeli yapıya geçiş sonrası karşılaşılabilecek yaygın sorunlar ve çözümleri:

1. **API Entegrasyon Sorunları**:
   - Merkezi servis katmanında `console.log` ile debugging yapılabilir
   - API yanıtları için model doğrulama kontrolü eklenebilir

2. **UI Güncellememe Sorunları**:
   - Hook dependency array'leri kontrol edilmeli
   - useEffect çalışma sırası gözden geçirilmeli

3. **Formatlama Sorunları**:
   - formatleyicilerin tüm olası veri durumlarını işlediğinden emin olunmalı
   - null/undefined durumları için fallback değerler sağlanmalı

## Sonuç

Paket satışları modülü için dengeli yaklaşımın uygulanması, kodun bakımını kolaylaştırmış, tekrarı azaltmış ve gelecekteki genişletmelere daha hazır hale getirmiştir. Bu yapı, diğer modüllerle uyumlu çalışacak ve uygulama genelinde tutarlı bir mimari sağlayacaktır.

Bu README, paket satışları modülü için yapılan değişiklikleri açıklamakta ve gelecekteki geliştirmeler için bir yol haritası sunmaktadır. Aynı dengeli yaklaşım, uygulamanın diğer modüllerine de başarıyla uygulanmıştır (müşteriler, personeller, hizmetler ve paketler).



Yapılan İyileştirmeler

Modal Bileşenlerini Hook Yapısına Geçirdim:

PaymentsModal, NewPackageSaleModal ve EditPackageSaleModal bileşenlerini geçici mcpApi çözümü yerine doğrudan hook fonksiyonlarını alacak şekilde güncelledim.
Formatlama fonksiyonlarını merkezi /utils/packageSale/formatters.ts dosyasından içe aktardım.


Hook'ları Alt Bileşenlere Böldüm:

Karmaşıklığı azaltmak için üç ayrı hook oluşturdum:

usePackageSaleUI: UI durumu ve kullanıcı etkileşimi yönetimi
usePackageSaleData: Veri işlemleri ve API çağrıları
usePackageSaleManagement: Diğer hook'ların birleştirilmesi ve koordinasyonu




Önbelleğe Alma Stratejisi Ekledim:

usePackageSaleCache hook'unu oluşturarak veri önbelleğe alma mekanizması ekledim.
API çağrılarının gereksiz tekrarını önleyen ve kullanıcı deneyimini iyileştiren bir önbellek mekanizması uyguladım.


Arayüzü İyileştirdim:

PackageSalesClient.tsx dosyasını, daha iyi kod organizasyonu ve okunabilirlik için temizledim.
Kod içi başlıklar ve açıklayıcı yorumlar ekledim.


Kapsamlı Bir Belgeleme Oluşturdum:

Tüm değişiklikleri ve iyileştirmeleri açıklayan kapsamlı bir rapor hazırladım.
Dosya yapısı, kod kalitesi, performans iyileştirmeleri ve sonraki adımları belgeledim.



Tamamlanmış Dengeli Yaklaşım Mimarisi
Bu değişikliklerle, Paket Satışları modülü artık üç katmanlı dengeli bir mimari kullanıyor:

Formatters Katmanı (/utils/packageSale/formatters.ts): Formatlama ve doğrulama işlemleri
Servis Katmanı (/services/packageSaleService.ts): API entegrasyonu ve iş mantığı
Hook Katmanı (Alt hooklar + ana hook): UI durum yönetimi ve kullanıcı etkileşimleri

Kod artık daha modüler, daha az tekrarlı, bakımı daha kolay ve daha iyi performans sunuyor.
Bu iyileştirmeler, modern React geliştirme pratiklerine uygun olarak yapıldı ve kod kalitesini önemli ölçüde artırarak gelecekteki genişletmelere daha hazır bir yapı sağladı.



------ÜRÜNLER SAFYASI-----


# Dengeli ve Merkezi Yapıya Geçiş Rehberi

Bu rehber, ürünler modülünü dengeli ve merkezi yapıya geçirme sürecinde yaptığım tüm adımları ve değişiklikleri detaylı bir şekilde açıklamaktadır. Diğer modüllerde (sayfalar, bileşenler) de bu yaklaşımı uygulamak için referans olarak kullanabilirsiniz.

## 1. Dosya Yapısı Oluşturma

İlk adım olarak, dengeli yaklaşımın gerektirdiği 3 katmanlı yapı için gerekli dosyaları oluşturdum:

### 1.1. Formatlama Katmanı (`/utils/[module]/formatters.ts`)
```
/src/utils/product/formatters.ts
```

### 1.2. Servis Katmanı (`/services/[module]Service.ts`)
```
/src/services/productService.ts
```

### 1.3. Hook Katmanı (`/hooks/use[Module].ts`)
```
/src/hooks/useProductManagement.ts
```

## 2. Formatlama Katmanı İçeriği (`formatters.ts`)

Bu katmanda, veri formatlaması ve doğrulama işlevlerini tanımladım:

```typescript
// Temel formatlama fonksiyonları
export const formatProductName = (name: string): string => { ... }
export const formatPrice = (price: number): string => { ... }
export const formatStock = (stock: number): string => { ... }

// Doğrulama fonksiyonları
export const isValidProductName = (name: string): boolean => { ... }
export const isValidPrice = (price: number | string): boolean => { ... }
export const isValidStock = (stock: number | string): boolean => { ... }

// Merkezi doğrulama işlevi
export const validateProductData = (data: {...}): { valid: boolean; errors: Record<string, string> } => { ... }

// Veri normalizasyon işlevi
export const normalizeProductData = (data: {...}): {...} => { ... }
```

## 3. Servis Katmanı İçeriği (`productService.ts`)

Bu katmanda, API entegrasyonu ve veri işleme fonksiyonlarını tanımladım:

```typescript
// Tip tanımlamaları
export interface Product { ... }
export interface CreateProductParams { ... }
export interface UpdateProductParams { ... }

// API entegrasyonu fonksiyonları
export const getProducts = async (includeDeleted: boolean = false, showToast: boolean = false): Promise<Product[]> => { ... }
export const getProductById = async (id: string, showToast: boolean = false): Promise<Product | null> => { ... }
export const createProduct = async (data: CreateProductParams, showToast: boolean = false): Promise<Product> => { ... }
export const updateProduct = async (id: string, data: UpdateProductParams, showToast: boolean = false): Promise<Product> => { ... }
export const updateProductStock = async (id: string, newStock: number | string, showToast: boolean = false): Promise<Product> => { ... }
export const deleteProduct = async (id: string, showToast: boolean = false): Promise<{ success: boolean; message: string; deleteType?: string }> => { ... }
```

## 4. Hook Katmanı İçeriği (`useProductManagement.ts`)

Bu katmanda, UI state'lerini ve işlemleri tanımladım:

```typescript
// Hook props ve dönüş tipleri
interface UseProductManagementProps { ... }
interface UseProductManagementResult { ... }

// Ana hook fonksiyonu
export const useProductManagement = ({
  initialProducts = [],
  autoFetch = true,
  showToasts = true
}: UseProductManagementProps = {}): UseProductManagementResult => {
  // State tanımlamaları
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ... });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Yardımcı hook'lar
  const { toast } = useToast();
  const { canViewProducts, ... } = usePermissions();
  
  // Form işlemleri
  const validateForm = useCallback((): boolean => { ... }, [formData]);
  const resetForm = useCallback(() => { ... }, []);
  
  // API işlemleri
  const fetchProducts = useCallback(async () => { ... }, [canViewProducts, showToasts, toast]);
  const handleCreateProduct = useCallback(async (): Promise<Product | null> => { ... }, [canAddProducts, validateForm, formData, showToasts, toast, resetForm]);
  const handleUpdateProduct = useCallback(async (id: string): Promise<Product | null> => { ... }, [canEditProducts, validateForm, formData, showToasts, toast]);
  const handleDeleteProduct = useCallback(async (id: string): Promise<boolean> => { ... }, [canDeleteProducts, showToasts, toast, fetchProducts]);
  const handleProductStock = useCallback(async (id: string, newStock: number | string): Promise<Product | null> => { ... }, [canEditProducts, showToasts, toast]);
  
  // Etki (effect) tanımlamaları
  useEffect(() => { ... }, [autoFetch, fetchProducts]); // İlk yükleme
  useEffect(() => { ... }, [selectedProduct, resetForm]); // Seçili ürün değiştiğinde
  useEffect(() => { ... }, [formData, validateForm]); // Form değiştiğinde
  
  return {
    // State
    products,
    loading,
    error,
    formData,
    formErrors,
    selectedProduct,
    
    // Form işlemleri
    setFormData,
    resetForm,
    validateForm,
    setSelectedProduct,
    
    // Operasyonlar
    fetchProducts,
    handleCreateProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleProductStock,
    
    // Yetkilendirme
    permissions: { ... }
  };
};
```

## 5. Mevcut Bileşenleri Güncelleme

Mevcut sayfaları ve bileşenleri yeni yapıya uygun olarak güncelledim:

### 5.1. Ürünler Sayfası (`products/page.tsx`)

**Eski Yaklaşım:**
```typescript
// Eski MCP API çağrıları import etme
import { getProducts, deleteProduct } from '@/lib/mcp/products';

// Eski doğrudan API çağrıları
const fetchProducts = async () => {
  const result = await getProducts(false);
  // API sonucunu işleme...
};

const handleDelete = async (id: string) => {
  const result = await deleteProduct(id);
  // API sonucunu işleme...
};
```

**Yeni Yaklaşım:**
```typescript
// Hook import etme
import { useProductManagement } from "@/hooks/useProductManagement";
import { formatPrice } from '@/utils/product/formatters';

// Hook kullanımı
const {
  products,
  loading,
  selectedProduct,
  setSelectedProduct,
  fetchProducts,
  handleDeleteProduct,
  permissions
} = useProductManagement({
  autoFetch: true,
  showToasts: true
});

// Hook fonksiyonlarını kullanma
const handleDelete = async (id) => {
  if (!permissions.canDelete) return;
  // ...
  const success = await handleDeleteProduct(id);
  if (success) {
    fetchProducts();
  }
};
```

### 5.2. Yeni Ürün Modalı (`NewProductModal.tsx`)

**Eski Yaklaşım:**
```typescript
// Eski MCP API çağrıları import etme
import { createProduct } from "@/lib/mcp/products";

// Yerel state yönetimi
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [form, setForm] = useState({ ... });

const resetForm = () => { ... };

const handleSubmit = async (e: React.FormEvent) => {
  // Form doğrulama
  // ...
  
  setLoading(true);
  try {
    const result = await createProduct({ ... });
    // Sonuç işleme...
  } catch (error) {
    // Hata işleme...
  } finally {
    setLoading(false);
  }
};
```

**Yeni Yaklaşım:**
```typescript
// Hook import etme
import { useProductManagement } from "@/hooks/useProductManagement";

// Hook kullanımı
const {
  formData,
  setFormData,
  formErrors,
  loading,
  error,
  resetForm,
  handleCreateProduct
} = useProductManagement({ autoFetch: false });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const newProduct = await handleCreateProduct();
  
  if (newProduct) {
    onSuccess();
  }
};
```

### 5.3. Düzenleme Modalı (`EditProductModal.tsx`)

**Eski Yaklaşım:**
```typescript
// Eski MCP API çağrıları import etme
import { updateProduct } from "@/lib/mcp/products";

// Yerel state yönetimi
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [form, setForm] = useState({ ... });

// Prop olarak gelen ürünü form state'ine aktarma
useEffect(() => {
  if (product) {
    setForm({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
    });
  }
}, [product]);

const handleSubmit = async (e: React.FormEvent) => {
  // Form doğrulama
  // ...
  
  setLoading(true);
  try {
    const result = await updateProduct(product.id, { ... });
    // Sonuç işleme...
  } catch (error) {
    // Hata işleme...
  } finally {
    setLoading(false);
  }
};
```

**Yeni Yaklaşım:**
```typescript
// Hook import etme
import { useProductManagement } from "@/hooks/useProductManagement";

// Hook kullanımı
const {
  formData,
  setFormData,
  formErrors,
  loading,
  error,
  selectedProduct,
  setSelectedProduct,
  handleUpdateProduct
} = useProductManagement({ autoFetch: false });

// Prop olarak gelen ürünü hook state'ine aktarma
useEffect(() => {
  if (product && open) {
    setSelectedProduct(product);
  }
}, [product, open, setSelectedProduct]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!product) return;
  
  const updatedProduct = await handleUpdateProduct(product.id);
  
  if (updatedProduct) {
    onSuccess();
  }
};
```

## 6. Eskiden Kalan Kodları Temizleme

### 6.1. Eski API Dosyasını Yedekleme
```
/src/lib/mcp/products/index.ts -> /src/lib/mcp/products/index.ts.backup
```

### 6.2. Eski API Dosyasını Yönlendirme Dosyasıyla Değiştirme
```typescript
// /src/lib/mcp/products/index.ts
/**
 * @deprecated Bu doğrudan MCP API çağrıları artık kullanımdan kaldırılmıştır. 
 * Lütfen bunun yerine /services/productService.ts dosyasındaki servisleri kullanın.
 */

import {
  getProducts as getProductsService,
  // ... diğer import'lar
} from '@/services/productService';

// Yönlendirme fonksiyonları - eski kod çağrıları için
export async function getProducts(includeDeleted = false) {
  console.warn('Deprecated: getProducts fonksiyonu kullanımdan kaldırılmıştır...');
  try {
    const products = await getProductsService(includeDeleted);
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Bir hata oluştu' };
  }
}

// ... diğer fonksiyonlar
```

## 7. Diğer Modüllere Geçiş İçin Adımlar

Başka bir modülü (örneğin, randevular, ödemeler vb.) dengeli yaklaşıma geçirmek için izlenecek adımlar:

### 7.1. Dosya Yapısı Oluşturma
```
1. /src/utils/[module]/formatters.ts
2. /src/services/[module]Service.ts
3. /src/hooks/use[Module].ts
```

### 7.2. Formatlama Katmanı
- Modül için gerekli formatlama fonksiyonları
- Doğrulama fonksiyonları
- Veri normalizasyon fonksiyonları

### 7.3. Servis Katmanı
- Tip tanımlamaları
- API entegrasyon fonksiyonları
- Hata yönetimi

### 7.4. Hook Katmanı
- UI state yönetimi
- Form işleme mantığı
- Yetkilendirme entegrasyonu
- API çağrı wrapper'ları

### 7.5. Mevcut Bileşenleri Güncelleme
- Doğrudan API çağrılarını hook çağrılarıyla değiştirme
- Yerel state'i hook state'iyle değiştirme
- Formatlama işlemlerini formatlayıcı işlevlerle değiştirme

### 7.6. Eski Kodları Temizleme
- Eski API dosyalarını yedekleme
- Yönlendirme dosyalarını oluşturma

## 8. Tavsiyeler ve En İyi Uygulamalar

1. **Aşamalı Geçiş**: Büyük modüllerde, tüm bileşenleri aynı anda değiştirmek yerine, adım adım geçiş yapın.

2. **Tip Güvenliği**: TypeScript tiplerini tüm katmanlarda kullanarak daha güvenli kod yazın.

3. **İsimlendirme Standartları**:
   - Formatlama fonksiyonları: `format*`, `isValid*`, `normalize*`
   - Servis fonksiyonları: `get*`, `create*`, `update*`, `delete*`
   - Hook fonksiyonları: `handle*`, `fetch*`, `reset*`

4. **Bağımlılık Yönetimi**: Hook'larda `useCallback` ve `useEffect` dependency array'lerini doğru tanımlayın.

5. **Hata Yönetimi**: Tüm katmanlarda tutarlı hata yönetimi uygulayın.

6. **Yetkilendirme**: Yetkilendirme kontrollerini hook seviyesinde merkezi olarak yapın.

7. **Yeniden Kullanılabilirlik**: Formatlama ve doğrulama işlevlerini mümkün olduğunca genel tutmaya çalışın.

8. **Belgelendirme**: Tüm katmanlarda kod dökümantasyonu ekleyin.

Bu rehber, dengeli ve merkezi yaklaşıma geçiş için detaylı bir yol haritası ve referans sağlamaktadır. Diğer modülleri bu yaklaşıma geçirirken bu adımları izleyebilir ve gerektiğinde bu dökümana başvurabilirsiniz.



----PAKET SATIŞLARI SAYFASI----

# Dengeli ve Merkezi Sisteme Geçiş Rehberi

Bu rehber, bir modülü eski sistemden dengeli ve merkezi mimariye geçirmek için izlenecek adımları detaylı olarak açıklamaktadır. Ürün Satışları modülünü örnek alarak, benzer modüller için yapılacak geçişlerde kullanabilirsiniz.

## 1. Genel Bakış ve Yapı Tanımı

### Dengeli Mimari Nedir?

Dengeli mimari, kodu üç temel katmana ayıran bir yaklaşımdır:

1. **Formatlama Katmanı** (`/utils/[module]/formatters.ts`)
   - Veri formatlamaları ve doğrulamaları
   - Tüm formatlama işlevleri burada merkezi olarak tutulur
   - Örn: para birimi, tarih, metin formatları

2. **Servis Katmanı** (`/services/[module]Service.ts`)
   - Tüm API entegrasyonu ve iş mantığı
   - Backend çağrıları ve veri işleme
   - Tip tanımlamaları

3. **Hook Katmanı** (`/hooks/use[Module]Management.ts`)
   - UI durum (state) yönetimi
   - Form yönetimi ve doğrulama
   - Kullanıcı etkileşimleri

Bu katmanlar arasındaki sorumluluk dağılımı, kodu daha modüler, test edilebilir ve bakımı kolay hale getirir.

## 2. Adım Adım Geçiş Süreci

### 2.1. Ön Hazırlık ve Analiz

1. **Mevcut kodu inceleyin**:
   - Formatlama kodlarını belirleyin (para birimi dönüşümleri, tarih formatları, vb.)
   - API çağrılarını belirleyin
   - State yönetimini ve form işlemlerini belirleyin

2. **Gerekli klasör yapısını oluşturun**:
   ```
   /src/utils/[module]/formatters.ts
   /src/services/[module]Service.ts
   /src/hooks/use[Module]Management.ts
   ```

3. **Mevcut kodun yedeğini alın**:
   ```
   /src/lib/mcp/[module]/index.ts -> /src/lib/mcp/[module]/index.ts.backup
   ```

### 2.2. Formatlama Katmanını Oluşturma

```typescript
// /src/utils/productSale/formatters.ts
'use client';

/**
 * [Module] için formatlama ve doğrulama işlevleri.
 * Tüm formatlama işlemleri burada merkezileştirilmiştir.
 */

/**
 * Tarih formatlaması (tr-TR)
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('tr-TR');
};

/**
 * Fiyat formatlaması (TL sembolü ile)
 */
export const formatPrice = (price: number): string => {
  if (price === undefined || price === null) return '';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(price);
};

/**
 * Form veri doğrulama
 */
export const validateData = (data: any): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Verileri doğrulama mantığı
  if (!data.field1) {
    errors.field1 = 'Bu alan zorunludur';
  }
  
  // ... diğer doğrulamalar
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ... diğer formatlama ve doğrulama işlevleri
```

### 2.3. Servis Katmanını Oluşturma

```typescript
// /src/services/productSaleService.ts
'use client';

import { callMcpApi } from '@/lib/mcp/helpers';
import { validateData } from '@/utils/productSale/formatters';

/**
 * [Module] tipi tanımlamaları
 */
export interface EntityType {
  id: string;
  // ... diğer alan tanımları
}

export interface CreateEntityParams {
  // ... oluşturma parametreleri
}

export interface UpdateEntityParams {
  // ... güncelleme parametreleri
}

/**
 * Tüm kayıtları getiren fonksiyon
 */
export const getEntities = async (
  filters?: any,
  showToast: boolean = false
): Promise<EntityType[]> => {
  try {
    const response = await callMcpApi('get-entities', filters || {}, {
      showToast,
      customErrorMsg: 'Liste alınamadı'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Liste alınamadı');
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Liste alınırken hata:', error);
    throw error;
  }
};

/**
 * Yeni kayıt oluşturma
 */
export const createEntity = async (
  data: CreateEntityParams,
  showToast: boolean = false
): Promise<EntityType> => {
  try {
    // Veri doğrulama
    const validation = validateData(data);
    if (!validation.valid) {
      const errorMessage = Object.values(validation.errors)[0] || 'Form verileri geçerli değil';
      throw new Error(errorMessage);
    }
    
    const response = await callMcpApi('create-entity', data, {
      showToast,
      customErrorMsg: 'Kayıt oluşturulamadı'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Kayıt oluşturulamadı');
    }
    
    return response.data;
  } catch (error) {
    console.error('Kayıt oluşturulurken hata:', error);
    throw error;
  }
};

// Güncelleme, silme vb. diğer API fonksiyonları...
```

### 2.4. Hook Katmanını Oluşturma

```typescript
// /src/hooks/useProductSaleManagement.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
  EntityType,
  getEntities,
  createEntity,
  updateEntity,
  deleteEntity,
  // ... diğer servis fonksiyonları
} from '@/services/productSaleService';
import { validateData } from '@/utils/productSale/formatters';

// Hook props ve dönüş tipi tanımları
interface UseModuleManagementProps {
  initialEntities?: EntityType[];
  autoFetch?: boolean;
  showToasts?: boolean;
}

interface UseModuleManagementResult {
  // State değerleri
  entities: EntityType[];
  loading: boolean;
  error: string | null;
  selectedEntity: EntityType | null;
  // ... diğer state değerleri

  // Form değerleri
  formData: any;
  formErrors: Record<string, string>;
  
  // Setter fonksiyonları
  setEntities: React.Dispatch<React.SetStateAction<EntityType[]>>;
  setSelectedEntity: React.Dispatch<React.SetStateAction<EntityType | null>>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  
  // İşlem fonksiyonları
  fetchEntities: () => Promise<void>;
  handleCreate: () => Promise<EntityType | null>;
  handleUpdate: (id: string) => Promise<EntityType | null>;
  handleDelete: (id: string) => Promise<boolean>;
  
  // Form işlemleri
  validateForm: () => boolean;
  resetForm: () => void;
  
  // Yetkilendirme
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

/**
 * [Module] yönetimi için özel React hook'u
 */
export const useModuleManagement = ({
  initialEntities = [],
  autoFetch = true,
  showToasts = true
}: UseModuleManagementProps = {}): UseModuleManagementResult => {
  // State tanımlamaları
  const [entities, setEntities] = useState<EntityType[]>(initialEntities);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    // ... form alanları
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Son işlem zamanı (performans optimizasyonu için)
  const lastOperationTime = useRef<number>(Date.now());
  
  // Yardımcı hook'lar
  const { toast } = useToast();
  const {
    canViewEntities,
    canAddEntities,
    canEditEntities,
    canDeleteEntities,
  } = usePermissions();
  
  /**
   * Veri getirme
   */
  const fetchEntities = useCallback(async () => {
    if (!canViewEntities) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getEntities({}, showToasts);
      setEntities(data);
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Veriler yüklenirken bir hata oluştu');
      if (showToasts) {
        toast({
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Veriler yüklenirken bir hata oluştu',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [canViewEntities, showToasts, toast]);
  
  /**
   * Form doğrulama
   */
  const validateForm = useCallback((): boolean => {
    const validation = validateData(formData);
    setFormErrors(validation.errors);
    return validation.valid;
  }, [formData]);
  
  /**
   * Yeni kayıt oluşturma
   */
  const handleCreate = useCallback(async (): Promise<EntityType | null> => {
    if (!canAddEntities) {
      if (showToasts) {
        toast({
          title: 'Yetkisiz İşlem',
          description: 'Kayıt oluşturma yetkiniz bulunmamaktadır',
          variant: 'destructive',
        });
      }
      return null;
    }
    
    // Form doğrulama
    if (!validateForm()) {
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const newEntity = await createEntity(formData, showToasts);
      
      // State güncelleme (ek API isteği yapmadan)
      setEntities(prev => [...prev, newEntity]);
      
      // Form temizleme
      resetForm();
      
      return newEntity;
    } catch (error: any) {
      setError(error instanceof Error ? error.message : 'Kayıt oluşturulurken bir hata oluştu');
      if (showToasts) {
        toast({
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Kayıt oluşturulurken bir hata oluştu',
          variant: 'destructive',
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [canAddEntities, formData, validateForm, showToasts, toast]);
  
  // ... diğer işlem fonksiyonları (update, delete, vb.)
  
  /**
   * Form sıfırlama
   */
  const resetForm = useCallback(() => {
    setFormData({
      // ... varsayılan değerler
    });
    setFormErrors({});
  }, []);
  
  // İlk yükleme
  useEffect(() => {
    if (autoFetch) {
      fetchEntities();
    }
  }, [autoFetch, fetchEntities]);
  
  // Seçili kayıt değiştiğinde form verilerini güncelleme
  useEffect(() => {
    if (selectedEntity) {
      setFormData({
        // ... seçili kayıt verileri
      });
    } else {
      resetForm();
    }
  }, [selectedEntity, resetForm]);
  
  return {
    // State değerleri
    entities,
    loading,
    error,
    selectedEntity,
    
    // Form değerleri
    formData,
    formErrors,
    
    // Setter fonksiyonları
    setEntities,
    setSelectedEntity,
    setFormData,
    
    // İşlem fonksiyonları
    fetchEntities,
    handleCreate,
    handleUpdate,
    handleDelete,
    
    // Form işlemleri
    validateForm,
    resetForm,
    
    // Yetkilendirme
    permissions: {
      canView: canViewEntities,
      canAdd: canAddEntities,
      canEdit: canEditEntities,
      canDelete: canDeleteEntities
    }
  };
};
```

### 2.5. Eski API Çağrılarını Yönlendirme

```typescript
// /src/lib/mcp/productSale/index.ts
'use client';

/**
 * @deprecated Bu dosya artık kullanılmamaktadır. Lütfen yeni merkezi yapıyı kullanın:
 * - API çağrıları için: /services/productSaleService.ts
 * - State yönetimi için: /hooks/useProductSaleManagement.ts
 * - Formatlar için: /utils/productSale/formatters.ts
 */

import {
  getEntities as getEntitiesService,
  createEntity as createEntityService,
  updateEntity as updateEntityService,
  deleteEntity as deleteEntityService,
  // ... diğer servis fonksiyonları
} from '@/services/productSaleService';

// Geriye dönük uyumluluk için yönlendirme
export async function getEntities(filters?: any) {
  console.warn('DEPRECATED: getEntities fonksiyonu kullanımdan kaldırılmıştır. Lütfen /services/productSaleService.ts içindeki getEntities fonksiyonunu kullanın.');
  try {
    const data = await getEntitiesService(filters, false);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Bir hata oluştu' };
  }
}

// ... diğer eski API fonksiyonları için yönlendirmeler
```

### 2.6. Bileşenleri Güncelleme

#### Ana Sayfa Bileşeni

```tsx
// /src/app/(protected)/[module]/page.tsx
"use client";

import { withPageAuth } from "@/lib/auth";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
// Merkezi modüllerden import
import { useModuleManagement } from "@/hooks/useModuleManagement";
import { formatDate, formatPrice } from "@/utils/module/formatters";
import NewModal from "@/components/module/NewModal";
import EditModal from "@/components/module/EditModal";

function ModulePage() {
  // Merkezi hook kullanımı
  const {
    entities,
    loading,
    selectedEntity,
    setSelectedEntity,
    fetchEntities,
    handleDelete,
    permissions,
  } = useModuleManagement({ autoFetch: true });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0); // Güncelleme tetikleyici

  // Modal kapatıldığında güncelleme yapılmasını sağlama
  const handleModalClosed = () => {
    setUpdateCounter(prev => prev + 1);
  };

  // Güncelleme tetikleyicisi değiştiğinde verileri yeniden getir
  useEffect(() => {
    if (updateCounter > 0) {
      fetchEntities();
    }
  }, [updateCounter, fetchEntities]);

  // ... diğer yardımcı fonksiyonlar

  if (!permissions.canView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Yetkisiz Erişim</h1>
          <p className="mt-2">
            Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.
          </p>
        </div>
      </div>
    );
  }

  // Yükleniyor durumunda skeleton göster
  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Modül Başlığı</h1>
        {permissions.canAdd && (
          <Button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-pink-400 hover:bg-pink-500 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ekle
          </Button>
        )}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alan 1</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alan 2</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entities.length > 0 ? (
              entities.map((entity) => (
                <tr key={entity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{entity.field1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatPrice(entity.field2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      {permissions.canEdit && (
                        <button
                          onClick={() => {
                            setSelectedEntity(entity);
                            setIsEditModalOpen(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {permissions.canDelete && (
                        <button
                          onClick={() => handleDelete(entity.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Henüz kayıt bulunmamaktadır.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modallar */}
      <NewModal
        open={isNewModalOpen}
        onOpenChange={(open) => {
          setIsNewModalOpen(open);
          if (!open) handleModalClosed();
        }}
        onSuccess={() => {
          setIsNewModalOpen(false);
          handleModalClosed();
        }}
      />
      
      <EditModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setSelectedEntity(null);
            handleModalClosed();
          }
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedEntity(null);
          handleModalClosed();
        }}
        data={selectedEntity}
      />
    </div>
  );
}

export default withPageAuth(ModulePage);
```

#### Modal Bileşenleri

```tsx
// /src/components/module/NewModal.tsx

"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useModuleManagement } from '@/hooks/useModuleManagement'; // Merkezi hook'u import et
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function NewModal({
  open,
  onOpenChange,
  onSuccess,
}: NewModalProps) {
  const { toast } = useToast();
  
  // Merkezi hook'a erişim
  const {
    formData,
    setFormData,
    formErrors,
    submitting,
    handleCreate,
    resetForm,
    error
  } = useModuleManagement({ autoFetch: false });
  
  const [localError, setLocalError] = useState("");
  
  // Modal kapatıldığında formu sıfırla
  useEffect(() => {
    if (!open) {
      resetForm();
      setLocalError("");
    }
  }, [open, resetForm]);
  
  const handleSubmit = async () => {
    try {
      setLocalError("");
      
      // Merkezi hook ile kayıt oluşturma
      const newEntity = await handleCreate();
      
      if (newEntity) {
        toast({
          title: 'Başarılı',
          description: 'Kayıt başarıyla eklendi',
        });
        
        onSuccess();
      }
    } catch (error: any) {
      setLocalError(error.message || "İşlem sırasında bir hata oluştu");
      toast({
        title: 'Hata',
        description: error.message || 'İşlem sırasında bir hata oluştu',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Kayıt Ekle</DialogTitle>
        </DialogHeader>
        
        {(localError || error) && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {localError || error}
          </div>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="field1">Alan 1</label>
            <Input
              id="field1"
              value={formData.field1}
              onChange={(e) => setFormData({...formData, field1: e.target.value})}
              className={formErrors.field1 ? 'border-red-500' : ''}
            />
            {formErrors.field1 && (
              <p className="text-red-500 text-sm">{formErrors.field1}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="field2">Alan 2</label>
            <Input
              id="field2"
              type="number"
              value={formData.field2}
              onChange={(e) => setFormData({...formData, field2: e.target.value})}
              className={formErrors.field2 ? 'border-red-500' : ''}
            />
            {formErrors.field2 && (
              <p className="text-red-500 text-sm">{formErrors.field2}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="submit"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <span className="animate-spin mr-2 inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
                Kaydediliyor...
              </>
            ) : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 3. İleri Seviye Konular

### 3.1. Performans Optimizasyonları

#### Önbelleğe Alma

```typescript
// Önbelleğe alma mantığı eklenmiş servis

import { useState, useCallback, useRef } from 'react';

// Cache sistemi
interface CacheData<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milisaniye cinsinden
}

interface Cache {
  [key: string]: CacheData<any>;
}

const cache: Cache = {};

// Cache yönetim fonksiyonları
export const getFromCache = <T>(key: string): T | null => {
  const cacheItem = cache[key];
  if (!cacheItem) return null;
  
  const now = Date.now();
  if (now - cacheItem.timestamp > cacheItem.expiresIn) {
    // Cache süresi dolmuş, temizle
    delete cache[key];
    return null;
  }
  
  return cacheItem.data as T;
};

export const saveToCache = <T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void => {
  cache[key] = {
    data,
    timestamp: Date.now(),
    expiresIn
  };
};

export const invalidateCache = (keyPattern: string): void => {
  Object.keys(cache).forEach(key => {
    if (key.includes(keyPattern)) {
      delete cache[key];
    }
  });
};

// Servis fonksiyonunda cache kullanımı
export const getEntities = async (
  filters?: any,
  showToast: boolean = false
): Promise<EntityType[]> => {
  const cacheKey = `entities_${JSON.stringify(filters || {})}`;
  
  // Cache'den kontrol et
  const cachedData = getFromCache<EntityType[]>(cacheKey);
  if (cachedData) {
    console.log('Cache hit for:', cacheKey);
    return cachedData;
  }
  
  try {
    console.log('Cache miss for:', cacheKey);
    const response = await callMcpApi('get-entities', filters || {}, {
      showToast,
      customErrorMsg: 'Liste alınamadı'
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Liste alınamadı');
    }
    
    const data = response.data || [];
    
    // Cache'e kaydet (5 dakika süreyle)
    saveToCache(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('Liste alınırken hata:', error);
    throw error;
  }
};
```

#### useCallback ve useMemo Kullanımı

Hook içinde bileşen yeniden render performansını artırmak için:

```typescript
// Hesaplama işlemlerini optimize etme
const filteredEntities = useMemo(() => {
  return entities.filter(entity => entity.status === 'active');
}, [entities]);

// Fonksiyonları optimize etme
const handleSearch = useCallback((searchTerm: string) => {
  // Arama işlemi
}, [/* bağımlılıklar */]);
```

### 3.2. Geriye Dönük Uyumluluk

Eski modüllerden yeniye geçişi kolaylaştırmak için:

```typescript
// Eski API
export async function oldApiFunction(id: string) {
  console.warn('DEPRECATED: Bu fonksiyon kullanımdan kaldırılmıştır. Lütfen yeni servisi kullanın.');
  try {
    // Yeni API'ye yönlendir
    const result = await newApiFunction(id);
    
    // Eski format dönüşümü
    return {
      success: true,
      data: result,
      // eski API yanıt yapısı
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      // eski API hata yapısı
    };
  }
}
```

## 4. Test ve Sorun Giderme

### 4.1. Test Listesi

Geçiş sonrası şu maddeleri kontrol edin:

1. **CRUD İşlemleri**: Ekleme, okuma, güncelleme ve silme işlemlerinin çalıştığını doğrulayın
2. **Form Doğrulama**: Form alanlarında doğrulamaların düzgün çalıştığını kontrol edin
3. **Hata Yönetimi**: Hata mesajlarının doğru görüntülendiğini kontrol edin
4. **Yetkilendirme**: Yetki kontrollerinin beklendiği gibi çalıştığını doğrulayın
5. **Performans**: Sayfa yükleme ve işlem sürelerini kontrol edin

### 4.2. Yaygın Sorunlar ve Çözümleri

1. **Sonsuz Render Döngüsü**:
   - `useEffect` bağımlılık dizilerini kontrol edin
   - `useState` çağrılarının koşullu yapılmadığından emin olun

2. **State Güncelleme Sorunları**:
   - State güncellemelerinin asenkron olduğunu unutmayın
   - Bir state güncellemesi sonrası hemen erişmek yerine, `useEffect` kullanın

3. **Veri Tipleri Hataları**:
   - Backend API'den gelen veriler ile frontend beklentilerinin uyumlu olduğunu doğrulayın
   - Null/undefined kontrolleri ekleyin

## 5. En İyi Uygulama Tavsiyeleri

1. **Tek Sorumluluk İlkesi**:
   - Her dosyanın ve fonksiyonun tek bir görevi olmalıdır
   - Formatleyiciler sadece formatlama, servisler sadece API entegrasyonu yapmalı

2. **Tutarlı İsimlendirme**:
   - Tüm formatleyici fonksiyonları `format*` şeklinde başlayabilir (`formatPrice`)
   - Tüm doğrulama fonksiyonları `validate*` veya `isValid*` şeklinde olabilir

3. **Bağımlılıkları Minimize Etme**:
   - Her katman sadece gerçekten ihtiyaç duyduğu modüllere bağlı olmalı
   - Döngüsel bağımlılıklardan kaçının

4. **Kapsamlı Hata Yakalama**:
   - Tüm asenkron işlemleri try/catch bloklarıyla sarın
   - Kullanıcı dostu hata mesajları oluşturun

5. **Kod Belgelendirme**:
   - Karmaşık işlemler için JSDoc yorumları kullanın
   - Tip tanımlamalarını eksiksiz yapın

## 6. Örnek Modül Listesi ve Geçiş Adımları

Projenizdeki diğer modüller için planlama:

1. **Müşteriler Modülü**
   - `/utils/customer/formatters.ts`
   - `/services/customerService.ts`
   - `/hooks/useCustomerManagement.ts`

2. **Personel Modülü**
   - `/utils/staff/formatters.ts`
   - `/services/staffService.ts`
   - `/hooks/useStaffManagement.ts`

3. **Hizmetler Modülü**
   - `/utils/service/formatters.ts`
   - `/services/serviceService.ts`
   - `/hooks/useServiceManagement.ts`

4. **Ürünler Modülü**
   - `/utils/product/formatters.ts`
   - `/services/productService.ts`
   - `/hooks/useProductManagement.ts`

5. **Ürün Satışları Modülü**
   - `/utils/productSale/formatters.ts`
   - `/services/productSaleService.ts`
   - `/hooks/useProductSaleManagement.ts`

## 7. Sonuç

Dengeli ve merkezi sistem mimarisine geçiş, kodunuzu daha bakımı kolay, test edilebilir ve genişletilebilir hale getirir. Kodu katmanlara ayırarak, her bir bileşenin sorumluluğunu sınırlayıp, tekrar kullanılabilirliği artırırsınız.

Bu rehber, herhangi bir modülü benzeri şekilde geçirmek için ihtiyaç duyacağınız tüm adımları ve kod parçalarını içermektedir. Yazılan kodu gereksinimlerinize göre uyarlayarak, projenizin tüm modüllerini aynı tutarlı mimariye geçirebilirsiniz.


-----TAHSİLATLAR SAFYASI---


# Tahsilatlar Modülü Merkezi ve Dengeli Sistem Dönüşümü Rehberi

## 1. Genel Bakış ve Mimari Yapı

Tahsilatlar (payments) modülünü merkezi ve dengeli bir sistem mimarisine dönüştürmek için aşağıdaki üç katmanlı yapıyı uyguladık:

1. **Formatlama Katmanı**: `/utils/payment/formatters.ts`
   - Formatlama ve doğrulama işlevleri
   - Veri dönüşümleri ve standartlaştırma

2. **Servis Katmanı**: `/services/paymentService.ts`
   - API entegrasyonu
   - Veri işleme ve doğrulama
   - Hata yönetimi

3. **Hook Katmanı**: 
   - Ana Hook: `/hooks/usePaymentManagement.ts`
   - Veri Hook: `/hooks/usePaymentData.ts`
   - UI Hook: `/hooks/usePaymentUI.ts`

4. **Önbellek Katmanı**: `/utils/cache/paymentCache.ts`
   - Veri önbellekleme
   - Önbellek yönetimi

## 2. Oluşturulan Yeni Dosyalar ve İçerikleri

### 2.1. Önbellek Sistemi (`/utils/cache/paymentCache.ts`)

Önbellek sistemi, sık erişilen verileri geçici olarak saklamak ve gereksiz API çağrılarını azaltmak için oluşturuldu:

```typescript
'use client';

import { Payment, PaymentFilterOptions } from '@/services/paymentService';

/**
 * Önbellek veri yapısı tiplemesi
 */
interface CacheData<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

/**
 * Tahsilat önbelleği arayüzü
 */
interface PaymentCache {
  [key: string]: CacheData<Payment[]>;
}

// Önbellek nesnesi
const paymentCache: PaymentCache = {};

/**
 * Önbellek anahtarı oluşturan yardımcı fonksiyon
 */
export const createCacheKey = (filters: PaymentFilterOptions = {}): string => {
  return `payments_${JSON.stringify(filters)}`;
};

/**
 * Tahsilatları önbelleğe kaydeden fonksiyon
 */
export const cachePayments = (key: string, data: Payment[], expiresInMs: number = 5 * 60 * 1000): void => {
  paymentCache[key] = {
    data,
    timestamp: Date.now(),
    expiresIn: expiresInMs
  };
  
  console.log(`[paymentCache] ${data.length} tahsilat önbelleğe kaydedildi, anahtar: ${key}`);
};

/**
 * Önbellekten tahsilatları getiren fonksiyon
 */
export const getCachedPayments = (key: string): Payment[] | null => {
  const cached = paymentCache[key];
  if (!cached) {
    console.log(`[paymentCache] Önbellekte veri bulunamadı, anahtar: ${key}`);
    return null;
  }
  
  // Süre kontrolü
  if (Date.now() - cached.timestamp > cached.expiresIn) {
    console.log(`[paymentCache] Önbellek süresi doldu, anahtar: ${key}`);
    delete paymentCache[key];
    return null;
  }
  
  console.log(`[paymentCache] ${cached.data.length} tahsilat önbellekten alındı, anahtar: ${key}`);
  return cached.data;
};

/**
 * Belirli bir anahtara sahip önbelleği geçersiz kılan fonksiyon
 */
export const invalidateCache = (key: string): void => {
  if (paymentCache[key]) {
    delete paymentCache[key];
    console.log(`[paymentCache] Önbellek geçersiz kılındı, anahtar: ${key}`);
  }
};

/**
 * Tüm tahsilat önbelleğini geçersiz kılan fonksiyon
 */
export const invalidateAllPaymentCache = (): void => {
  Object.keys(paymentCache).forEach(key => {
    delete paymentCache[key];
  });
  console.log(`[paymentCache] Tüm tahsilat önbelleği geçersiz kılındı`);
};

/**
 * Önbellek durumunu kontrol eden fonksiyon
 */
export const getCacheStats = (): { size: number, keys: string[] } => {
  return {
    size: Object.keys(paymentCache).length,
    keys: Object.keys(paymentCache)
  };
};
```

### 2.2. Veri İşlemleri Hook'u (`/hooks/usePaymentData.ts`)

Sadece veri yönetimi ve API entegrasyonu sorumluluğuna sahip daha modüler bir hook:

```typescript
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Payment,
  PaymentFilterOptions,
  CreatePaymentParams,
  getPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
  deletePayment,
  getCustomers,
  getPackageSales
} from '@/services/paymentService';
import { calculateTotalAmount } from '@/utils/payment/formatters';
import { 
  cachePayments, 
  getCachedPayments, 
  createCacheKey,
  invalidateCache
} from '@/utils/cache/paymentCache';

/**
 * usePaymentData hook parametreleri
 */
interface UsePaymentDataProps {
  autoFetch?: boolean;
  showToasts?: boolean;
  defaultFilters?: PaymentFilterOptions;
  cacheEnabled?: boolean;
  cacheExpirationTime?: number;
}

/**
 * usePaymentData hook dönüş değeri
 */
interface UsePaymentDataResult {
  // Veri state'leri
  payments: Payment[];
  selectedPayment: Payment | null;
  customers: any[];
  packageSales: any[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  totalAmount: number;
  refreshing: boolean;
  
  // Filtreler
  filters: PaymentFilterOptions;
  
  // Setterlar
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setSelectedPayment: React.Dispatch<React.SetStateAction<Payment | null>>;
  setFilters: React.Dispatch<React.SetStateAction<PaymentFilterOptions>>;
  
  // Veri işlemleri
  fetchPayments: (newFilters?: PaymentFilterOptions) => Promise<void>;
  fetchPaymentById: (id: string) => Promise<Payment | null>;
  createNewPayment: (data: CreatePaymentParams) => Promise<Payment | null>;
  updatePaymentStatusFn: (id: string, status: string) => Promise<Payment | null>;
  deletePaymentFn: (id: string) => Promise<boolean>;
  handleRefresh: () => Promise<void>;
  
  // Yardımcı veriler
  fetchCustomers: () => Promise<any[]>;
  fetchPackageSales: (customerId?: string) => Promise<any[]>;
  
  // Yetkilendirme
  permissions: {
    canView: boolean;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
  
  // Cache işlemleri
  invalidatePaymentCache: () => void;
}

/**
 * Tahsilatlar ile ilgili veri yönetimi hook'u
 */
export const usePaymentData = ({
  autoFetch = true,
  showToasts = true,
  defaultFilters = {},
  cacheEnabled = true,
  cacheExpirationTime = 5 * 60 * 1000 // 5 dakika varsayılan
}: UsePaymentDataProps = {}): UsePaymentDataResult => {
  // State tanımlamaları
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [packageSales, setPackageSales] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filters, setFilters] = useState<PaymentFilterOptions>(defaultFilters);
  
  // Son işlem zamanı
  const lastOperationTime = useRef<number>(Date.now());
  
  // Toast ve permissions hooks
  const { toast } = useToast();
  const {
    canViewPayments,
    canEditPayments,
    canAddPayments = canEditPayments,
    canDeletePayments = canEditPayments
  } = usePermissions();
  
  /**
   * Tahsilatları getiren fonksiyon
   */
  const fetchPayments = useCallback(async (newFilters?: PaymentFilterOptions) => {
    if (!canViewPayments) {
      setError('Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Yeni filtreler varsa güncelle
      const currentFilters = newFilters || filters;
      if (newFilters) {
        setFilters(newFilters);
      }
      
      // Önbellekten veri kontrolü
      if (cacheEnabled) {
        const cacheKey = createCacheKey(currentFilters);
        const cachedData = getCachedPayments(cacheKey);
        
        if (cachedData) {
          console.log('[usePaymentData] Önbellekten tahsilatlar yüklendi');
          setPayments(cachedData);
          
          // Toplam tahsilat tutarını hesapla
          const total = calculateTotalAmount(cachedData);
          setTotalAmount(total);
          
          setLoading(false);
          return;
        }
      }
      
      // Önbellekte yok, API'dan getir
      console.log('[usePaymentData] Tahsilatlar API\'dan getiriliyor...', currentFilters);
      const data = await getPayments(currentFilters, showToasts);
      
      setPayments(data);
      
      // Önbelleğe al
      if (cacheEnabled) {
        const cacheKey = createCacheKey(currentFilters);
        cachePayments(cacheKey, data, cacheExpirationTime);
      }
      
      // Toplam tahsilat tutarını hesapla
      const total = calculateTotalAmount(data);
      setTotalAmount(total);
      
      // İşlem zamanını güncelle
      lastOperationTime.current = Date.now();
    } catch (error: any) {
      console.error('[usePaymentData] fetchPayments hatası:', error);
      setError(error instanceof Error ? error.message : 'Tahsilatlar yüklenirken bir hata oluştu');
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Tahsilatlar yüklenirken bir hata oluştu'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canViewPayments, filters, showToasts, toast, cacheEnabled, cacheExpirationTime]);
  
  /**
   * ID'ye göre tahsilat getiren fonksiyon
   */
  const fetchPaymentById = useCallback(async (id: string): Promise<Payment | null> => {
    if (!canViewPayments) {
      setError('Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.');
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await getPaymentById(id, showToasts);
      setSelectedPayment(data);
      return data;
    } catch (error: any) {
      console.error(`[usePaymentData] fetchPaymentById hatası:`, error);
      setError(error instanceof Error ? error.message : 'Tahsilat detayları yüklenirken bir hata oluştu');
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Tahsilat detayları yüklenirken bir hata oluştu'
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [canViewPayments, showToasts, toast]);
  
  /**
   * Yeni tahsilat oluşturan fonksiyon
   */
  const createNewPayment = useCallback(async (data: CreatePaymentParams): Promise<Payment | null> => {
    if (!canAddPayments) {
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Yetkisiz İşlem',
          description: 'Tahsilat oluşturma yetkiniz bulunmamaktadır'
        });
      }
      return null;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const newPayment = await createPayment(data, showToasts);
      
      // Önbelleği geçersiz kıl
      if (cacheEnabled) {
        invalidateCache(createCacheKey(filters));
      }
      
      // Tahsilat listesini güncelle (API çağrısı yapmadan)
      setPayments(prev => [newPayment, ...prev]);
      
      // Toplam miktarı güncelle
      if (newPayment.status === 'Tamamlandı') {
        setTotalAmount(prev => prev + newPayment.amount);
      }
      
      if (showToasts) {
        toast({
          title: 'Başarılı',
          description: 'Tahsilat başarıyla oluşturuldu'
        });
      }
      
      return newPayment;
    } catch (error: any) {
      console.error('[usePaymentData] createNewPayment hatası:', error);
      setError(error instanceof Error ? error.message : 'Tahsilat oluşturulurken bir hata oluştu');
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Tahsilat oluşturulurken bir hata oluştu'
        });
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [canAddPayments, filters, showToasts, toast, cacheEnabled]);
  
  /**
   * Tahsilat durumunu güncelleyen fonksiyon
   */
  const updatePaymentStatusFn = useCallback(async (id: string, status: string): Promise<Payment | null> => {
    if (!canEditPayments) {
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Yetkisiz İşlem',
          description: 'Tahsilat durumunu güncelleme yetkiniz bulunmamaktadır'
        });
      }
      return null;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const updatedPayment = await updatePaymentStatus(id, status, showToasts);
      
      // Önbelleği geçersiz kıl
      if (cacheEnabled) {
        invalidateCache(createCacheKey(filters));
      }
      
      // Tahsilatlar listesini güncelle (API çağrısı yapmadan)
      setPayments(prev => 
        prev.map(payment => 
          payment.id === id ? updatedPayment : payment
        )
      );
      
      // Seçili tahsilatı da güncelle
      if (selectedPayment && selectedPayment.id === id) {
        setSelectedPayment(updatedPayment);
      }
      
      // Toplam miktarı güncelle
      if (status !== 'Tamamlandı' && (selectedPayment?.status === 'Tamamlandı')) {
        // Tamamlandı durumundan başka bir duruma geçişte, tutarı toplam miktardan çıkar
        setTotalAmount(prev => prev - (selectedPayment?.amount || 0));
      } else if (status === 'Tamamlandı' && selectedPayment?.status !== 'Tamamlandı') {
        // Başka bir durumdan Tamamlandı durumuna geçişte, tutarı toplam miktara ekle
        setTotalAmount(prev => prev + (selectedPayment?.amount || 0));
      }
      
      if (showToasts) {
        toast({
          title: 'Başarılı',
          description: 'Tahsilat durumu başarıyla güncellendi'
        });
      }
      
      return updatedPayment;
    } catch (error: any) {
      console.error('[usePaymentData] updatePaymentStatusFn hatası:', error);
      setError(error instanceof Error ? error.message : 'Tahsilat durumu güncellenirken bir hata oluştu');
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Tahsilat durumu güncellenirken bir hata oluştu'
        });
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [canEditPayments, selectedPayment, showToasts, toast, filters, cacheEnabled]);
  
  /**
   * Tahsilat silme (soft delete) fonksiyonu
   */
  const deletePaymentFn = useCallback(async (id: string): Promise<boolean> => {
    if (!canDeletePayments) {
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Yetkisiz İşlem',
          description: 'Tahsilat silme yetkiniz bulunmamaktadır'
        });
      }
      return false;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // İlgili tahsilatı bul (toplam miktarı güncellemek için)
      const targetPayment = payments.find(p => p.id === id);
      
      const deletedPayment = await deletePayment(id, showToasts);
      
      // Önbelleği geçersiz kıl
      if (cacheEnabled) {
        invalidateCache(createCacheKey(filters));
      }
      
      // Tahsilatlar listesini güncelle (API çağrısı yapmadan)
      setPayments(prev => 
        prev.map(payment => 
          payment.id === id ? { ...payment, status: 'İptal Edildi' } : payment
        )
      );
      
      // Toplam miktarı güncelle
      if (targetPayment?.status === 'Tamamlandı') {
        setTotalAmount(prev => prev - (targetPayment?.amount || 0));
      }
      
      if (showToasts) {
        toast({
          title: 'Başarılı',
          description: 'Tahsilat başarıyla iptal edildi'
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('[usePaymentData] deletePaymentFn hatası:', error);
      setError(error instanceof Error ? error.message : 'Tahsilat silinirken bir hata oluştu');
      if (showToasts) {
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Tahsilat silinirken bir hata oluştu'
        });
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [canDeletePayments, payments, showToasts, toast, filters, cacheEnabled]);
  
  /**
   * Manuel yenileme işlemi
   */
  const handleRefresh = useCallback(async () => {
    // Önbelleği geçersiz kıl
    if (cacheEnabled) {
      invalidateCache(createCacheKey(filters));
    }
    
    setRefreshing(true);
    await fetchPayments();
  }, [fetchPayments, filters, cacheEnabled]);
  
  /**
   * Müşterileri getiren fonksiyon
   */
  const fetchCustomers = useCallback(async (): Promise<any[]> => {
    try {
      const data = await getCustomers(showToasts);
      setCustomers(data);
      return data;
    } catch (error) {
      console.error('[usePaymentData] fetchCustomers hatası:', error);
      return [];
    }
  }, [showToasts]);
  
  /**
   * Paket satışlarını getiren fonksiyon
   */
  const fetchPackageSales = useCallback(async (customerId?: string): Promise<any[]> => {
    try {
      // Son 3 aylık paket satışlarını getir
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      
      const packageFilters = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        customerId
      };
      
      const data = await getPackageSales(packageFilters, showToasts);
      setPackageSales(data);
      return data;
    } catch (error) {
      console.error('[usePaymentData] fetchPackageSales hatası:', error);
      return [];
    }
  }, [showToasts]);
  
  /**
   * Önbelleği geçersiz kılma fonksiyonu
   */
  const invalidatePaymentCache = useCallback(() => {
    if (cacheEnabled) {
      invalidateCache(createCacheKey(filters));
      console.log('[usePaymentData] Tahsilat önbelleği geçersiz kılındı');
    }
  }, [filters, cacheEnabled]);
  
  // İlk yükleme
  useEffect(() => {
    if (autoFetch && canViewPayments) {
      fetchPayments();
    }
  }, [autoFetch, canViewPayments, fetchPayments]);
  
  return {
    // Veri state'leri
    payments,
    selectedPayment,
    customers,
    packageSales,
    loading,
    submitting,
    error,
    totalAmount,
    refreshing,
    
    // Filtreler
    filters,
    
    // Setterlar
    setPayments,
    setSelectedPayment,
    setFilters,
    
    // Veri işlemleri
    fetchPayments,
    fetchPaymentById,
    createNewPayment,
    updatePaymentStatusFn,
    deletePaymentFn,
    handleRefresh,
    
    // Yardımcı veriler
    fetchCustomers,
    fetchPackageSales,
    
    // Önbellek işlemleri
    invalidatePaymentCache,
    
    // Yetkilendirme
    permissions: {
      canView: canViewPayments,
      canAdd: canAddPayments,
      canEdit: canEditPayments,
      canDelete: canDeletePayments
    }
  };
};

export default usePaymentData;
```

### 2.3. UI İşlemleri Hook'u (`/hooks/usePaymentUI.ts`)

Sadece UI mantığı ve form işlemlerinden sorumlu hook:

```typescript
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { validatePaymentData } from '@/utils/payment/formatters';
import { CreatePaymentParams } from '@/services/paymentService';

/**
 * usePaymentUI hook parametreleri
 */
interface UsePaymentUIProps {
  formValidationDelay?: number;
}

/**
 * usePaymentUI hook dönüş değeri
 */
interface UsePaymentUIResult {
  // Form state'leri
  formData: {
    customerId: string;
    amount: string;
    paymentType: string;
    paymentMethod: string;
    packageSaleId: string;
    productSaleId?: string;
    installment: string;
    receiptNumber: string;
    notes: string;
    processedBy: string;
  };
  formErrors: Record<string, string>;
  
  // Form işlemleri
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validateForm: () => boolean;
  resetForm: () => void;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  getSubmitData: () => CreatePaymentParams | null;
  
  // UI yardımcıları
  printPayment: () => void;
  clearFormErrors: () => void;
  setCustomFormError: (field: string, message: string) => void;
  
  // Form değişiklik takibi
  formIsDirty: boolean;
  resetFormDirty: () => void;
}

/**
 * Tahsilat UI işlemleri hook'u
 */
export const usePaymentUI = ({
  formValidationDelay = 500
}: UsePaymentUIProps = {}): UsePaymentUIResult => {
  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    paymentType: 'Nakit',
    paymentMethod: 'Hizmet Ödemesi',
    packageSaleId: '',
    productSaleId: '',
    installment: '',
    receiptNumber: '',
    notes: '',
    processedBy: ''
  });
  
  // Form hataları
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Form değişikliği takibi
  const [formIsDirty, setFormIsDirty] = useState(false);
  
  /**
   * Form doğrulama
   */
  const validateForm = useCallback((): boolean => {
    const validation = validatePaymentData(formData);
    setFormErrors(validation.errors);
    return validation.valid;
  }, [formData]);
  
  /**
   * Form reset
   */
  const resetForm = useCallback(() => {
    setFormData({
      customerId: '',
      amount: '',
      paymentType: 'Nakit',
      paymentMethod: 'Hizmet Ödemesi',
      packageSaleId: '',
      productSaleId: '',
      installment: '',
      receiptNumber: '',
      notes: '',
      processedBy: ''
    });
    setFormErrors({});
    setFormIsDirty(false);
  }, []);
  
  /**
   * Form değişikliği işleyicisi
   */
  const handleFormChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Form değişikliği takibi
    setFormIsDirty(true);
    
    // Seçime bağlı alanları temizle
    if (name === 'paymentMethod') {
      if (value !== 'Paket Ödemesi') {
        setFormData(prev => ({ ...prev, packageSaleId: '', [name]: value }));
      }
      if (value !== 'Ürün Ödemesi') {
        setFormData(prev => ({ ...prev, productSaleId: '', [name]: value }));
      }
    }
    
    if (name === 'paymentType' && value !== 'Kredi Kartı') {
      setFormData(prev => ({ ...prev, installment: '', [name]: value }));
    }
  }, []);
  
  /**
   * Gönderim için form verisini hazırlama
   */
  const getSubmitData = useCallback((): CreatePaymentParams | null => {
    if (!validateForm()) {
      return null;
    }
    
    return {
      customerId: formData.customerId,
      amount: parseFloat(formData.amount),
      paymentType: formData.paymentType,
      paymentMethod: formData.paymentMethod,
      packageSaleId: formData.packageSaleId || undefined,
      productSaleId: formData.productSaleId || undefined,
      installment: formData.installment ? parseInt(formData.installment) : undefined,
      receiptNumber: formData.receiptNumber || undefined,
      notes: formData.notes || undefined,
      processedBy: formData.processedBy,
      status: 'Tamamlandı',
      date: new Date().toISOString()
    };
  }, [formData, validateForm]);
  
  /**
   * Tahsilat yazdırma
   */
  const printPayment = useCallback(() => {
    window.print();
  }, []);
  
  /**
   * Form hatalarını temizleme
   */
  const clearFormErrors = useCallback(() => {
    setFormErrors({});
  }, []);
  
  /**
   * Özel form hatası ekleme
   */
  const setCustomFormError = useCallback((field: string, message: string) => {
    setFormErrors(prev => ({
      ...prev,
      [field]: message
    }));
  }, []);
  
  /**
   * Form değişiklik takibini sıfırlama
   */
  const resetFormDirty = useCallback(() => {
    setFormIsDirty(false);
  }, []);
  
  // Form değişikliği takibi için ek bellek optimizasyonu
  const formDataSnapshot = useMemo(() => JSON.stringify(formData), [formData]);
  
  // Form değiştiğinde doğrulama
  useEffect(() => {
    // Performans için gecikme ile doğrulama yap
    const timeoutId = setTimeout(() => {
      if (formIsDirty) {
        validateForm();
      }
    }, formValidationDelay);
    
    return () => clearTimeout(timeoutId); // Temizlik
  }, [formDataSnapshot, validateForm, formIsDirty, formValidationDelay]);
  
  return {
    // Form state'leri
    formData,
    formErrors,
    
    // Form işlemleri
    setFormData,
    validateForm,
    resetForm,
    handleFormChange,
    getSubmitData,
    
    // UI yardımcıları
    printPayment,
    clearFormErrors,
    setCustomFormError,
    
    // Form değişiklik takibi
    formIsDirty,
    resetFormDirty
  };
};

export default usePaymentUI;
```

### 2.4. Ana Koordinasyon Hook'u (`/hooks/usePaymentManagement.ts`)

Alt hook'ları birleştirip koordine eden ana hook:

```typescript
'use client';

import { useCallback, useMemo } from 'react';
import { usePaymentData } from '@/hooks/usePaymentData';
import { usePaymentUI } from '@/hooks/usePaymentUI';
import { Payment, PaymentFilterOptions } from '@/services/paymentService';

/**
 * usePaymentManagement hook parametreleri
 */
interface UsePaymentManagementProps {
  initialPayments?: Payment[];
  autoFetch?: boolean;
  showToasts?: boolean;
  defaultFilters?: PaymentFilterOptions;
  formValidationDelay?: number;
  cacheEnabled?: boolean;
  cacheExpirationTime?: number;
}

/**
 * Ana tahsilat yönetimi hook'u
 * Veri ve UI katmanlarını birleştirir
 */
export const usePaymentManagement = ({
  initialPayments = [],
  autoFetch = true,
  showToasts = true,
  defaultFilters = {},
  formValidationDelay = 500,
  cacheEnabled = true,
  cacheExpirationTime = 5 * 60 * 1000
}: UsePaymentManagementProps = {}) => {
  // Alt hook'ları kullan
  const paymentData = usePaymentData({
    autoFetch,
    showToasts,
    defaultFilters,
    cacheEnabled,
    cacheExpirationTime
  });
  
  const paymentUI = usePaymentUI({
    formValidationDelay
  });
  
  /**
   * Yeni tahsilat oluştur
   */
  const handleCreatePayment = useCallback(async () => {
    const submitData = paymentUI.getSubmitData();
    if (!submitData) return null;
    
    const result = await paymentData.createNewPayment(submitData);
    
    if (result) {
      // Başarılı oluşturmadan sonra formu temizle
      paymentUI.resetForm();
    }
    
    return result;
  }, [paymentData, paymentUI]);
  
  /**
   * Tahsilat durumunu güncelle
   */
  const handleUpdatePaymentStatus = useCallback(async (id: string, status: string) => {
    return await paymentData.updatePaymentStatusFn(id, status);
  }, [paymentData]);
  
  /**
   * Tahsilat sil
   */
  const handleDeletePayment = useCallback(async (id: string) => {
    return await paymentData.deletePaymentFn(id);
  }, [paymentData]);
  
  /**
   * Tamamlanan tahsilatlar - performans optimizasyonu için memoize
   */
  const completedPayments = useMemo(() => {
    return paymentData.payments.filter(p => 
      p.status === 'Tamamlandı' || p.status === 'COMPLETED'
    );
  }, [paymentData.payments]);
  
  /**
   * İptal edilen veya iade edilen tahsilatlar - performans optimizasyonu için memoize
   */
  const cancelledPayments = useMemo(() => {
    return paymentData.payments.filter(p => 
      p.status === 'İptal Edildi' || p.status === 'CANCELLED' || 
      p.status === 'İade Edildi' || p.status === 'REFUNDED'
    );
  }, [paymentData.payments]);
  
  /**
   * Tarihe göre gruplanmış tahsilatlar - performans optimizasyonu için memoize
   */
  const paymentsByDate = useMemo(() => {
    const groups: Record<string, Payment[]> = {};
    
    paymentData.payments.forEach(payment => {
      // Tarih kısmını al (saat olmadan)
      const date = new Date(payment.createdAt).toISOString().split('T')[0];
      
      if (!groups[date]) {
        groups[date] = [];
      }
      
      groups[date].push(payment);
    });
    
    // Tarihleri sırala
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, payments]) => ({
        date,
        payments
      }));
  }, [paymentData.payments]);
  
  return {
    // Veri state'leri
    ...paymentData,
    
    // Form state'leri  
    ...paymentUI,
    
    // Ana işlemler  
    handleCreatePayment,
    handleUpdatePaymentStatus,
    handleDeletePayment,
    
    // Hesaplanmış değerler
    completedPayments,
    cancelledPayments,
    paymentsByDate
  };
};

export default usePaymentManagement;
```

### 2.5. Genişletilmiş Formatlama Fonksiyonları (`/utils/payment/formatters.ts`)

Formatlama, doğrulama ve hesaplama işlevleri:

```typescript
'use client';

/**
 * Tahsilatlar modülü için formatlama ve doğrulama işlevleri
 */

import { format, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Para miktarını TL formatında formatlayan fonksiyon
 */
export const formatPrice = (amount: number): string => {
  if (amount === undefined || amount === null) return '';
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Para birimini hesaplama formatında formatlayan fonksiyon (sembol olmadan)
 */
export const formatDecimal = (value: number): string => {
  if (value === undefined || value === null) return '';
  
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Tarihi formatlayan fonksiyon
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'dd MMMM yyyy', { locale: tr });
};

/**
 * Tarih ve saati formatlayan fonksiyon
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'dd MMMM yyyy HH:mm', { locale: tr });
};

/**
 * Sadece saat bilgisini formatlayan fonksiyon
 */
export const formatTime = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'HH:mm', { locale: tr });
};

/**
 * Tarihi lokalleştirilmiş ISO formatına çevirir (YYYY-MM-DD)
 */
export const toLocalISOString = (date: Date): string => {
  if (!date || !isValid(date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Ödeme geçmişi için grup başlığı formatlaması
 */
export const formatPaymentHistoryGroupTitle = (date: string): string => {
  // Aynı gün içindeki ödemeleri gruplamak için
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return date;
  
  return format(dateObj, 'd MMMM yyyy', { locale: tr });
};

/**
 * Ödeme türünü standardize eden fonksiyon
 */
export const getPaymentTypeText = (type: string): string => {
  if (!type) return '';
  
  const paymentTypeMap: Record<string, string> = {
    'CASH': 'Nakit',
    'Nakit': 'Nakit',
    'nakit': 'Nakit',
    'CREDIT_CARD': 'Kredi Kartı',
    'Kredi Kartı': 'Kredi Kartı',
    'kredi kartı': 'Kredi Kartı',
    'kredi karti': 'Kredi Kartı',
    'Kart': 'Kredi Kartı',
    'kart': 'Kredi Kartı',
    'BANK_TRANSFER': 'Havale/EFT',
    'Havale/EFT': 'Havale/EFT',
    'havale/eft': 'Havale/EFT',
    'havale': 'Havale/EFT',
    'Havale': 'Havale/EFT',
    'EFT': 'Havale/EFT',
    'eft': 'Havale/EFT'
  };
  
  return paymentTypeMap[type] || type;
};

/**
 * Ödeme şeklini standardize eden fonksiyon
 */
export const getPaymentMethodText = (method: string): string => {
  if (!method) return '';
  
  const paymentMethodMap: Record<string, string> = {
    'SERVICE_PAYMENT': 'Hizmet Ödemesi',
    'Hizmet Ödemesi': 'Hizmet Ödemesi',
    'hizmet ödemesi': 'Hizmet Ödemesi',
    'hizmet odemesi': 'Hizmet Ödemesi',
    'PACKAGE_PAYMENT': 'Paket Ödemesi',
    'Paket Ödemesi': 'Paket Ödemesi',
    'paket ödemesi': 'Paket Ödemesi',
    'paket odemesi': 'Paket Ödemesi',
    'PRODUCT_PAYMENT': 'Ürün Ödemesi',
    'Ürün Ödemesi': 'Ürün Ödemesi',
    'ürün ödemesi': 'Ürün Ödemesi',
    'urun odemesi': 'Ürün Ödemesi'
  };
  
  return paymentMethodMap[method] || method;
};

/**
 * Ödeme durumunu standardize eden fonksiyon
 */
export const getStatusText = (status: string): string => {
  if (!status) return '';
  
  const statusMap: Record<string, string> = {
    'COMPLETED': 'Tamamlandı',
    'Tamamlandı': 'Tamamlandı',
    'REFUNDED': 'İade Edildi',
    'İade Edildi': 'İade Edildi',
    'CANCELLED': 'İptal Edildi',
    'İptal Edildi': 'İptal Edildi'
  };
  
  return statusMap[status] || status;
};

/**
 * Ödeme durumuna göre renk sınıfları döndüren fonksiyon
 */
export const getStatusColor = (status: string): string => {
  if (!status) return 'bg-gray-100 text-gray-800';
  
  const statusKey = status.toUpperCase();
  const colors: Record<string, string> = {
    'COMPLETED': 'bg-green-100 text-green-800',
    'TAMAMLANDI': 'bg-green-100 text-green-800',
    'REFUNDED': 'bg-yellow-100 text-yellow-800',
    'İADE EDILDI': 'bg-yellow-100 text-yellow-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'İPTAL EDILDI': 'bg-red-100 text-red-800'
  };
  
  return colors[statusKey] || 'bg-gray-100 text-gray-800';
};

/**
 * Ödeme durumuna göre badge component sınıflarını döndüren fonksiyon
 */
export const getStatusBadgeClass = (status: string): string => {
  if (!status) return 'bg-gray-100';
  
  const statusKey = status.toUpperCase();
  const colors: Record<string, string> = {
    'COMPLETED': 'bg-green-500',
    'TAMAMLANDI': 'bg-green-500',
    'REFUNDED': 'bg-yellow-500',
    'İADE EDILDI': 'bg-yellow-500',
    'CANCELLED': 'bg-red-500',
    'İPTAL EDILDI': 'bg-red-500'
  };
  
  return colors[statusKey] || 'bg-gray-500';
};

/**
 * Tahsilat için özet bilgi formatlaması
 */
export const formatPaymentSummary = (payment: any): string => {
  if (!payment) return '';
  
  const methodText = getPaymentMethodText(payment.paymentMethod);
  const typeText = getPaymentTypeText(payment.paymentType);
  const formattedAmount = formatPrice(payment.amount);
  
  return `${formattedAmount} - ${typeText} (${methodText})`;
};

/**
 * Tahsilat oluşturma/güncelleme form verisini doğrulama
 */
export const validatePaymentData = (
  data: {
    customerId?: string;
    amount?: string | number;
    paymentType?: string;
    paymentMethod?: string;
    processedBy?: string;
    packageSaleId?: string;
    productSaleId?: string;
  }
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Müşteri seçilmiş mi?
  if (!data.customerId) {
    errors.customerId = 'Müşteri seçilmelidir';
  }
  
  // Tutar geçerli mi?
  if (!data.amount) {
    errors.amount = 'Tutar girilmelidir';
  } else {
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Geçerli bir tutar girilmelidir';
    }
  }
  
  // Ödeme türü seçilmiş mi?
  if (!data.paymentType) {
    errors.paymentType = 'Ödeme türü seçilmelidir';
  }
  
  // Ödeme şekli seçilmiş mi?
  if (!data.paymentMethod) {
    errors.paymentMethod = 'Ödeme şekli seçilmelidir';
  }
  
  // Ödeme şekli paket ödemesi ise paket seçilmiş mi?
  if (data.paymentMethod === 'Paket Ödemesi' && !data.packageSaleId) {
    errors.packageSaleId = 'Paket seçilmelidir';
  }
  
  // Ödeme şekli ürün ödemesi ise ürün seçilmiş mi?
  if (data.paymentMethod === 'Ürün Ödemesi' && !data.productSaleId) {
    errors.productSaleId = 'Ürün seçilmelidir';
  }
  
  // İşlemi yapan personel girilmiş mi?
  if (!data.processedBy) {
    errors.processedBy = 'İşlemi yapan personel girilmelidir';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Tamamlanmış tahsilatların toplam tutarını hesaplayan yardımcı fonksiyon
 */
export const calculateTotalAmount = (payments: any[]): number => {
  if (!Array.isArray(payments)) return 0;
  
  return payments.reduce((sum: number, payment: any) => {
    if (!payment || !payment.amount) return sum;
    
    if (payment.status === 'COMPLETED' || payment.status === 'Tamamlandı') {
      return sum + payment.amount;
    }
    return sum;
  }, 0);
};

/**
 * Ödeme tiplerine göre toplam tutarları hesaplayan yardımcı fonksiyon
 */
export const calculatePaymentTypeBreakdown = (payments: any[]): Record<string, number> => {
  if (!Array.isArray(payments)) return {};
  
  const breakdown: Record<string, number> = {
    cash: 0,       // Nakit
    creditCard: 0, // Kredi Kartı
    transfer: 0    // Havale/EFT
  };
  
  payments.forEach(payment => {
    if (!payment || !payment.amount || payment.status !== 'Tamamlandı') return;
    
    const type = payment.paymentType.toLowerCase();
    
    if (type.includes('nakit')) {
      breakdown.cash += payment.amount;
    } else if (type.includes('kart')) {
      breakdown.creditCard += payment.amount;
    } else if (type.includes('havale') || type.includes('eft')) {
      breakdown.transfer += payment.amount;
    }
  });
  
  return breakdown;
};

/**
 * Para birimini sayısal değere dönüştüren fonksiyon
 */
export const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  
  // TL, ₺, nokta, virgül ve boşlukları temizle
  const cleanedValue = value.replace(/[^0-9,]/g, '').replace(',', '.');
  const parsedValue = parseFloat(cleanedValue);
  
  return isNaN(parsedValue) ? 0 : parsedValue;
};

/**
 * Ödeme referans numarası formatlaması
 */
export const formatReferenceNumber = (refNumber: string | number): string => {
  if (!refNumber) return '';
  
  const refString = String(refNumber);
  
  // 16 haneli kredi kartı referans numarası formatlaması
  if (/^\d{16}$/.test(refString)) {
    return refString.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
  }
  
  return refString;
};
```

### 2.6. Optimize Edilmiş Servis Katmanı (`/services/paymentService.ts`)

API entegrasyonu ve merkezi veri işleme:

```typescript
'use client';

import { callMcpApi } from '@/lib/mcp/helpers';
import { 
  getPaymentTypeText, 
  getPaymentMethodText, 
  getStatusText
} from '@/utils/payment/formatters';

/**
 * Tahsilat arayüzü (type tanımı)
 */
export interface Payment {
  id: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  installment: number | null;
  receiptNumber: string | null;
  status: string;
  processedBy: string;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  packageSale?: {
    id: string;
    package: {
      id: string;
      name: string;
    };
    price: number;
  };
  productSale?: {
    id: string;
    product: {
      id: string;
      name: string;
    };
  };
  appointment?: {
    id: string;
    service: {
      id: string;
      name: string;
    };
  };
}

/**
 * Tahsilat oluşturma parametre arayüzü
 */
export interface CreatePaymentParams {
  customerId: string;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  packageSaleId?: string;
  productSaleId?: string;
  appointmentId?: string;
  processedBy: string;
  status?: string;
  installment?: number;
  receiptNumber?: string;
  notes?: string;
  date?: string;
}

/**
 * Tahsilat düzenleme parametre arayüzü
 */
export interface UpdatePaymentParams {
  amount?: number;
  paymentType?: string;
  paymentMethod?: string;
  installment?: number;
  receiptNumber?: string;
  notes?: string;
  processedBy?: string;
}

/**
 * Tahsilat filtreleme parametre arayüzü
 */
export interface PaymentFilterOptions {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  staffId?: string;
  paymentType?: string;
  paymentMethod?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Servis konfigürasyonu
 */
const CONFIG = {
  defaultErrorMessages: {
    fetch: 'Tahsilat listesi alınamadı',
    fetchById: 'Tahsilat detayları alınamadı',
    create: 'Tahsilat oluşturulamadı',
    update: 'Tahsilat güncellenemedi',
    updateStatus: 'Tahsilat durumu güncellenemedi',
    delete: 'Tahsilat silinemedi'
  },
  apiEndpoints: {
    list: 'get-payments',
    getById: 'get-payment-by-id',
    create: 'create-payment',
    update: 'update-payment',
    updateStatus: 'update-payment-status',
    delete: 'delete-payment'
  }
};

/**
 * Veri standartlaştırma yardımcı fonksiyonu
 */
const standardizePaymentData = (paymentData: CreatePaymentParams | UpdatePaymentParams) => {
  // Kopyalama ile veriyi değiştirmeden işleme
  const standardizedData = { ...paymentData };
  
  // Ödeme türü ve şeklini standartlaştır
  if ('paymentType' in standardizedData && standardizedData.paymentType) {
    standardizedData.paymentType = getPaymentTypeText(standardizedData.paymentType);
  }
  
  if ('paymentMethod' in standardizedData && standardizedData.paymentMethod) {
    standardizedData.paymentMethod = getPaymentMethodText(standardizedData.paymentMethod);
  }
  
  if ('status' in standardizedData && standardizedData.status) {
    standardizedData.status = getStatusText(standardizedData.status);
  }
  
  return standardizedData;
};

/**
 * API çağrısı yardımcı fonksiyonu
 */
const executeApiCall = async <T>(
  endpoint: string, 
  params: any, 
  errorMessage: string,
  showToast: boolean = false
): Promise<T> => {
  try {
    console.log(`[paymentService] ${endpoint} çağrıldı`, params);
    
    const response = await callMcpApi(endpoint, params, {
      showToast,
      customErrorMsg: errorMessage
    });
    
    if (!response.success) {
      throw new Error(response.error || errorMessage);
    }
    
    return response.data;
  } catch (error) {
    console.error(`[paymentService] ${endpoint} hatası:`, error);
    throw error;
  }
};

/**
 * Tüm tahsilatları getiren fonksiyon
 */
export const getPayments = async (
  filters: PaymentFilterOptions = {}, 
  showToast: boolean = false
): Promise<Payment[]> => {
  return executeApiCall<Payment[]>(
    CONFIG.apiEndpoints.list, 
    filters, 
    CONFIG.defaultErrorMessages.fetch,
    showToast
  );
};

/**
 * ID'ye göre tahsilat getiren fonksiyon
 */
export const getPaymentById = async (
  id: string, 
  showToast: boolean = false
): Promise<Payment> => {
  return executeApiCall<Payment>(
    CONFIG.apiEndpoints.getById, 
    { id }, 
    CONFIG.defaultErrorMessages.fetchById,
    showToast
  );
};

/**
 * Yeni tahsilat oluşturan fonksiyon
 */
export const createPayment = async (
  data: CreatePaymentParams, 
  showToast: boolean = false
): Promise<Payment> => {
  // Veriyi standartlaştır
  const standardizedData = standardizePaymentData(data);
  
  return executeApiCall<Payment>(
    CONFIG.apiEndpoints.create, 
    standardizedData, 
    CONFIG.defaultErrorMessages.create,
    showToast
  );
};

/**
 * Tahsilat güncelleyen fonksiyon
 */
export const updatePayment = async (
  id: string,
  data: UpdatePaymentParams, 
  showToast: boolean = false
): Promise<Payment> => {
  // Veriyi standartlaştır
  const standardizedData = standardizePaymentData(data);
  
  return executeApiCall<Payment>(
    CONFIG.apiEndpoints.update, 
    { id, ...standardizedData }, 
    CONFIG.defaultErrorMessages.update,
    showToast
  );
};

/**
 * Tahsilat durumunu güncelleyen fonksiyon
 */
export const updatePaymentStatus = async (
  id: string, 
  status: string, 
  showToast: boolean = false
): Promise<Payment> => {
  // Durumu standartlaştır
  const standardStatus = getStatusText(status);
  
  return executeApiCall<Payment>(
    CONFIG.apiEndpoints.updateStatus, 
    { id, status: standardStatus }, 
    CONFIG.defaultErrorMessages.updateStatus,
    showToast
  );
};

/**
 * Tahsilatı silen (soft delete) fonksiyon
 */
export const deletePayment = async (
  id: string, 
  showToast: boolean = false
): Promise<Payment> => {
  return executeApiCall<Payment>(
    CONFIG.apiEndpoints.delete, 
    { id }, 
    CONFIG.defaultErrorMessages.delete,
    showToast
  );
};

/**
 * Müşterileri getiren yardımcı fonksiyon
 */
export const getCustomers = async (
  showToast: boolean = false
): Promise<any[]> => {
  return executeApiCall<any[]>(
    'get-customers', 
    {}, 
    'Müşteri listesi alınamadı',
    showToast
  );
};

/**
 * Paket satışlarını getiren yardımcı fonksiyon
 */
export const getPackageSales = async (
  filters: { startDate?: string; endDate?: string; customerId?: string } = {},
  showToast: boolean = false
): Promise<any[]> => {
  return executeApiCall<any[]>(
    'get-package-sales', 
    filters, 
    'Paket satışları alınamadı',
    showToast
  );
};

/**
 * Ürün satışlarını getiren yardımcı fonksiyon
 */
export const getProductSales = async (
  filters: { startDate?: string; endDate?: string; customerId?: string } = {},
  showToast: boolean = false
): Promise<any[]> => {
  return executeApiCall<any[]>(
    'get-product-sales', 
    filters, 
    'Ürün satışları alınamadı',
    showToast
  );
};

/**
 * Randevuları getiren yardımcı fonksiyon
 */
export const getAppointments = async (
  filters: { customerId?: string } = {},
  showToast: boolean = false
): Promise<any[]> => {
  return executeApiCall<any[]>(
    'get-appointments', 
    filters, 
    'Randevular alınamadı',
    showToast
  );
};
```

## 3. Yenilikler ve İyileştirmeler

### 3.1. Önbelleğe Alma Sistemi

- **Performans Artışı**: Sık tekrarlanan aynı API çağrıları için veri önbelleklemesi
- **Akıllı Önbellek Süresi**: Otomatik süre kontrolü ve temizlik mekanizması
- **Önbellek Geçersiz Kılma**: CRUD operasyonlarından sonra önbelleğin otomatik güncellenmesi

### 3.2. Modülerleştirilmiş Hook Yapısı

- **Sorumluluk Ayrımı**: Her hook'un belirli bir sorumluluğu var
- **Kod Tekrarını Azaltma**: Daha temiz ve sürdürülebilir kod yapısı
- **Kolay Test Edilebilirlik**: Her katmanın ayrı ayrı test edilebilmesi

### 3.3. Gelişmiş Formatlama İşlevleri

- **Çeşitli Format Seçenekleri**: Tarih, saat, para birimi vb. için geniş format seçenekleri
- **Standardizasyon**: Veri tutarsızlıklarını önleyen standardizasyon işlevleri
- **Hesaplama İşlevleri**: Toplam, dağılım, fark hesaplama gibi yardımcı işlevler

### 3.4. Performans İyileştirmeleri

- **useMemo ve useCallback**: Gereksiz yeniden hesaplamaları önleyen optimizasyonlar
- **Yerel State Güncellemeleri**: API çağrısı yapmadan state güncelleme
- **Doğrulama Gecikmesi**: Form doğrulama için gecikme mekanizması

### 3.5. Form İşleme İyileştirmeleri

- **Form Kirlilik Takibi**: Kullanıcı değişikliklerini izleme mekanizması
- **Koşullu Form Alanları**: Birbirine bağlı form alanlarının yönetimi
- **Merkezi Form Doğrulama**: Tekrar kullanılabilir doğrulama mantığı

## 4. Eski Kodların Temizlenmesi

### 4.1. API Çağrılarının Güncellenmesi

- Eski direkt MCP çağrıları, merkezi servis katmanıyla değiştirildi
- `lib/mcp/...` içindeki eski fonksiyonlar `@deprecated` olarak işaretlendi
- Uyarı mesajları ile yeni API yolunu gösteren yönlendirmeler eklendi

### 4.2. Backend MCP-Tools Güncellenmesi

- Backend API işlevleri yerine `/utils/payment/formatters.ts` içindeki formatlama fonksiyonlarını kullanma
- Yeni standardize edilmiş API endpoint yapısını uyarlama

## 5. Uygulama Önerileri

### 5.1. Benzer Modüller İçin Aynı Yaklaşım

Bu yaklaşım tüm modüllere (müşteriler, hizmetler, ürünler vb.) uygulanabilir. İzlenmesi gereken genel adımlar:

1. Formatlama İşlevlerini Belirleme
2. API Çağrılarını Merkezi Servise Taşıma
3. Veri İşleme Hook'u Oluşturma
4. UI İşleme Hook'u Oluşturma
5. Ana Koordinasyon Hook'u Oluşturma
6. Önbellek Mekanizmasını Ekleme
7. Bileşenleri Güncelleme

### 5.2. Modüller Arası Entegrasyon

- Önbellek yapısı bir modüldeki değişikliklerin diğer modüllere etkisi düşünülerek tasarlanmalı
- Veri tutarlılığı için ilişkili modüllerin önbelleklerini birlikte yönetme stratejisi oluşturulmalı

Bu rehber, herhangi bir modülü merkezi ve dengeli sisteme geçirirken izlenmesi gereken adımları detaylı olarak açıklamaktadır. Bu yapı sayesinde kod tekrarı azaltılır, performans artar ve bakım kolaylaşır.



-------

# Next.js Server-Client Kod Ayırma Hatası ve Çözümü

## Hata
Next.js uygulamasında "Attempted to call [fonksiyon adı] from the server but [fonksiyon adı] is on the client. It's not possible to invoke a Client function from the server" hatası alındığında bu, `'use client'` direktifiyle işaretlenmiş bir client-side modülün server-side koddan çağrılmaya çalışıldığını gösterir.

## Hatanın Nedeni
Next.js'in React Server Components (RSC) mimarisinde client ve server kodları ayrı tutulmalıdır. Client direktifi ('use client') ile işaretlenmiş dosyalardaki fonksiyonlar server tarafından doğrudan çağrılamaz.

```javascript
// Hatalı kullanım
// Client modülü (/utils/example/formatters.ts)
'use client';
export function formatExample() { ... }

// Server modülü (/app/api/...)
import { formatExample } from '@/utils/example/formatters'; // HATA: Client fonksiyonu server'dan çağrılamaz
```

## Çözüm
İlgili fonksiyonları server tarafına taşımak veya her iki tarafta da tanımlamak gerekir:

```javascript
// Çözüm: Server modülüne gerekli fonksiyonları doğrudan eklemek
// Server modülü (/app/api/...)
function formatExample() {
  // Client fonksiyonun server versiyonu burada tanımlanır
  // ...aynı işlevsellik...
}
```

Bu durumda, client tarafındaki `/utils/payment/formatters.ts` gibi dosyalardan import edilen ve `'use client'` direktifi ile işaretli fonksiyonlar yerine, gerekli fonksiyonların server tarafında yeniden tanımlanması gerekir.



---------

# Randevu Oluşturma API Entegrasyonu Sorun Çözümü ve Yol Haritası

## 1. Tespit Edilen Sorun

Randevu oluşturma işleminde "createAppointment() from the server but createAppointment is on the client" hata mesajı alınıyordu. Bu, Next.js'in istemci/sunucu sınırlarının ihlal edildiğini gösteren tipik bir hatadır.

## 2. Sorunun Teknik Analizi

Sorunu analiz ettiğimizde şu yapısal problemleri tespit ettik:

1. **İstemci/Sunucu Karışımı**: İstemci tarafı fonksiyonlar (`appointmentService.ts` içindeki `createAppointment`) sunucu tarafından (`/api/mcp/route.ts`) doğrudan çağrılmaya çalışılıyordu.

2. **Tutarsız API Yapısı**: Randevu silme işlemi için sunucu tarafında `deleteAppointmentFromDb` gibi özel bir fonksiyon kullanılırken, randevu oluşturma işlemi için benzer bir yaklaşım yoktu.

3. **Katman İhlali**: MCP API endpoint'inden (`/api/mcp/route.ts`), istemci tarafı fonksiyonları (`mcpTools.createAppointment`) doğrudan çağrılıyordu.

## 3. Çözüm Adımları

Sorunu çözmek için şu adımları takip ettik:

1. **Sunucu Taraflı Randevu Oluşturma Fonksiyonu Ekleme**:
   - `/src/lib/appointment-service/index.js` dosyasına `createAppointmentInDb` fonksiyonu ekledik.
   - Bu fonksiyon, veritabanına doğrudan erişerek randevu oluşturma işlemini gerçekleştiriyor.

2. **API Endpoint'ini Düzenleme**:
   - `/src/app/api/mcp/route.ts` dosyasındaki `create-appointment` handler'ını düzenledik.
   - İstemci taraflı `mcpTools.createAppointment` yerine sunucu taraflı `createAppointmentInDb` fonksiyonunu çağıracak şekilde değiştirdik.

3. **Sınırları Netleştirme**:
   - Sunucu tarafında veritabanı işlemleri yapan fonksiyonlar, istemci tarafında UI ile etkileşimi yöneten fonksiyonlar arasındaki sınırı netleştirdik.

## 4. Merkezi ve Dengeli Yapıya Uyum

Çözümümüz, projenin hedeflediği merkezi ve üç katmanlı mimariye tam olarak uyum sağlamaktadır:

1. **Formatlama Katmanı** (`/utils/appointment/formatters.ts`):
   - Veri formatlamaları (tarih, durum, vb.)
   - Doğrulama işlevleri
   - Veri normalizasyon işlevleri

2. **Servis Katmanı**:
   - İstemci: `/services/appointmentService.ts` - API çağrıları
   - Sunucu: `/lib/appointment-service/index.js` - Veritabanı işlemleri
   - Api: `/services/api/apiService.ts` - Merkezi API entegrasyonu

3. **Hook Katmanı** (`/hooks/useAppointmentManagement.ts`):
   - UI state yönetimi
   - Form işleme mantığı
   - Kullanıcı etkileşimleri
   - Servis çağrıları

## 5. Benzer Sorunlar İçin Gelecek Yol Haritası

Next.js projelerinde istemci/sunucu sınırı sorunlarını çözmek için şu adımları takip edin:

1. **İstemci/Sunucu Ayrımını Net Yapın**:
   - İstemci tarafı kodları ('use client' direktifi ile) `/services/` ve `/hooks/` altında tutun
   - Sunucu tarafı kodları `/lib/` ve `/app/api/` altında tutun

2. **Her API Endpoint'i İçin İki Yönlü Servis Oluşturun**:
   - İstemci servis: UI ile etkileşim için (`xxxService.ts`)
   - Sunucu servis: Veritabanı işlemleri için (`xxx-service/index.js`)

3. **API Çağrı Zincirini Standartlaştırın**:
   ```
   UI → Hook → İstemci Servis → ApiService → API Endpoint → Sunucu Servis → Veritabanı
   ```

4. **Yeni Bir Endpoint Eklerken**:
   - Önce sunucu tarafı servis fonksiyonunu oluşturun
   - API endpoint'ini bu fonksiyonu çağıracak şekilde yapılandırın
   - İstemci servisini ve hook'u buna göre güncelleyin

## 6. İyi Uygulamalar

1. **Her API İşlemi İçin Üç Katmanlı Yapı Kullanın**:
   - Formatlama: `/utils/[modül]/formatters.ts`
   - Servis: 
     - İstemci: `/services/[modül]Service.ts`
     - Sunucu: `/lib/[modül]-service/index.js`
   - Hook: `/hooks/use[Modül]Management.ts`

2. **Tutarlı Hata Yönetimi**:
   - Her API yanıtını `{ success, data, error }` formatında standartlaştırın
   - Sunucu tarafı servislerden her zaman bu formatta yanıt döndürün
   - İstemci tarafında try/catch bloklarıyla hataları yakalayın

3. **Tip Güvenliği Sağlayın**:
   - Tüm modüller için TypeScript interface'leri tanımlayın
   - API istek ve yanıt tiplerini önceden tanımlayın

4. **Önbelleğe Alma Mekanizması Ekleyin**:
   - Sık kullanılan veriler için önbelleğe alma stratejisi belirleyin
   - Önbellek anahtarını parametrelere göre oluşturun
   - Veri değişikliklerinde önbelleği geçersiz kılın

Bu yol haritası, projenizde merkezi ve dengeli bir mimariye geçiş sürecinde karşılaşılabilecek benzer sorunların çözümünde rehber olacaktır.


------