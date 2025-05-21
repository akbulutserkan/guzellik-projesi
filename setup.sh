#!/bin/bash

# Renkli çıktılar için
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Appointment System Kurulum Aracı${NC}"
echo "==============================="
echo ""

# Bağımlılıkları yükle
echo -e "${GREEN}1. Node.js bağımlılıkları yükleniyor...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Bağımlılıklar yüklenirken bir hata oluştu.${NC}"
    exit 1
fi
echo "✓ Bağımlılıklar yüklendi."
echo ""

# Env dosyası kontrolü
echo -e "${GREEN}2. Çevre değişkenleri kontrolü yapılıyor...${NC}"
if [ ! -f .env ]; then
    echo "❌ .env dosyası bulunamadı."
    echo "📝 .env.example dosyasından bir .env dosyası oluşturuluyor..."
    cp .env.example .env
    echo "✓ .env dosyası oluşturuldu. Lütfen içindeki değerleri kendi ortamınıza göre düzenleyin."
else
    echo "✓ .env dosyası zaten mevcut."
fi
echo ""

# Prisma istemcisini oluştur
echo -e "${GREEN}3. Prisma istemcisi oluşturuluyor...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}Prisma istemcisi oluşturulurken bir hata meydana geldi.${NC}"
    exit 1
fi
echo "✓ Prisma istemcisi başarıyla oluşturuldu."
echo ""

# Veritabanı bağlantısını kontrol et
echo -e "${GREEN}4. Veritabanı bağlantısı kontrol ediliyor...${NC}"
echo "⏳ Bu adım biraz zaman alabilir..."
npx prisma db pull &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Veritabanı bağlantısı başarısız. Lütfen .env dosyasında DATABASE_URL'i doğru ayarladığınızdan emin olun.${NC}"
    echo "⚠️ Bu kuruluma devam edebilirsiniz, ancak uygulama veritabanı olmadan çalışmayacaktır."
else
    echo "✓ Veritabanı bağlantısı başarılı."
    
    # Migrasyonları çalıştır
    echo -e "${GREEN}5. Veritabanı migrasyonları yapılıyor...${NC}"
    npx prisma migrate dev --name init
    if [ $? -ne 0 ]; then
        echo -e "${RED}Migrasyon çalıştırılırken bir hata oluştu.${NC}"
    else
        echo "✓ Migrasyonlar başarıyla uygulandı."
        
        # Veritabanını seed et (isteğe bağlı)
        read -p "🌱 Veritabanına örnek veriler eklemek ister misiniz? (e/h): " seedChoice
        if [[ $seedChoice == "e" || $seedChoice == "E" ]]; then
            npm run db:seed
            if [ $? -ne 0 ]; then
                echo -e "${RED}Seed işlemi sırasında bir hata oluştu.${NC}"
            else
                echo "✓ Veritabanı örnek verilerle dolduruldu."
            fi
        fi
    fi
fi
echo ""

# Next.js build
echo -e "${GREEN}6. Next.js uygulaması derleniyor...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Uygulama derlenirken bir hata oluştu.${NC}"
else
    echo "✓ Uygulama başarıyla derlendi."
fi
echo ""

echo -e "${BLUE}Kurulum Tamamlandı!${NC}"
echo "==============================="
echo -e "✅ Uygulamayı geliştirme modunda çalıştırmak için: ${GREEN}npm run dev${NC}"
echo -e "✅ Uygulamayı production modunda çalıştırmak için: ${GREEN}npm run start${NC}"
echo -e "🔧 Herhangi bir sorunla karşılaşırsanız README.md dosyasına bakabilirsiniz."
echo ""
echo "İyi çalışmalar!"
