#!/bin/bash

# Renkli çıktılar için
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}GitHub Aktarım Aracı${NC}"
echo "======================"
echo ""

# GitHub kullanıcı adı ve repo kontrolü
read -p "GitHub kullanıcı adınız: " githubUsername
if [ -z "$githubUsername" ]; then
    echo -e "${RED}Kullanıcı adı boş olamaz.${NC}"
    exit 1
fi

read -p "Repo adı (varsayılan: appointment-system): " repoName
if [ -z "$repoName" ]; then
    repoName="appointment-system"
fi

# Git kontrolü
echo -e "${GREEN}1. Git kontrolü yapılıyor...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git kurulu değil. Lütfen önce Git'i yükleyin.${NC}"
    exit 1
fi
echo "✓ Git kurulu."
echo ""

# Git repo kontrolü
echo -e "${GREEN}2. Git repo durumu kontrol ediliyor...${NC}"
if [ -d .git ]; then
    echo "✓ Git reposu zaten mevcut."
    # Mevcut remote kontrol et
    if git remote -v | grep -q origin; then
        currentRemote=$(git remote get-url origin)
        echo -e "⚠️ Bu repo şu adresi kullanıyor: ${YELLOW}${currentRemote}${NC}"
        read -p "Adresi https://github.com/$githubUsername/$repoName.git olarak değiştirmek ister misiniz? (e/h): " changeRemote
        if [[ $changeRemote == "e" || $changeRemote == "E" ]]; then
            git remote set-url origin "https://github.com/$githubUsername/$repoName.git"
            echo "✓ Remote adresi güncellendi."
        fi
    else
        echo "ℹ️ Henüz bir remote adresi yok. Ekleniyor..."
        git remote add origin "https://github.com/$githubUsername/$repoName.git"
        echo "✓ Remote adresi eklendi."
    fi
else
    echo "ℹ️ Git reposu bulunamadı. Oluşturuluyor..."
    git init
    git remote add origin "https://github.com/$githubUsername/$repoName.git"
    echo "✓ Git reposu ve remote adresi oluşturuldu."
fi
echo ""

# Dosyaları stage'e al
echo -e "${GREEN}3. Dosyaları hazırlama...${NC}"
git add .
echo "✓ Dosyalar hazırlandı."
echo ""

# Commit
echo -e "${GREEN}4. Commit oluşturuluyor...${NC}"
read -p "Commit mesajı (varsayılan: Randevu Sistemi): " commitMessage
if [ -z "$commitMessage" ]; then
    commitMessage="Randevu Sistemi"
fi
git commit -m "$commitMessage"
echo "✓ Commit oluşturuldu."
echo ""

# GitHub repo kontrolü
echo -e "${GREEN}5. GitHub repo kontrolü...${NC}"
echo -e "${YELLOW}⚠️ NOT: Bu adımda GitHub'da $repoName adında bir repo oluşturmuş olmanız gerekiyor.${NC}"
read -p "GitHub'da $githubUsername/$repoName reposunu oluşturdunuz mu? (e/h): " repoCreated
if [[ $repoCreated != "e" && $repoCreated != "E" ]]; then
    echo "❌ Lütfen önce GitHub'da repo oluşturun:"
    echo "1. GitHub'a giriş yapın"
    echo "2. Sağ üst köşedeki + düğmesine tıklayın ve 'New repository' seçin"
    echo "3. Repo adını '$repoName' olarak girin"
    echo "4. 'Create repository' düğmesine tıklayın"
    echo ""
    echo "Repo oluşturduktan sonra bu betiği tekrar çalıştırın."
    exit 1
fi
echo "✓ GitHub repo kontrolü tamamlandı."
echo ""

# Push
echo -e "${GREEN}6. GitHub'a gönderiliyor...${NC}"
echo "⏳ Bu işlem biraz zaman alabilir..."
git push -u origin main
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Main branch push başarısız. Master branch deneniyor...${NC}"
    git push -u origin master
    if [ $? -ne 0 ]; then
        echo -e "${RED}Push işlemi başarısız oldu. Lütfen hata mesajlarını kontrol edin.${NC}"
        echo "Olası sorunlar:"
        echo "- GitHub kimlik doğrulama sorunları"
        echo "- Repo yetki sorunları"
        echo "- Git yapılandırma sorunları"
        exit 1
    fi
fi
echo "✓ Kodlar GitHub'a gönderildi."
echo ""

echo -e "${BLUE}İşlem Tamamlandı!${NC}"
echo "======================"
echo -e "✅ Kodlarınız başarıyla https://github.com/$githubUsername/$repoName adresine gönderildi."
echo -e "🌐 Repo URL: ${GREEN}https://github.com/$githubUsername/$repoName${NC}"
echo ""
echo "İyi çalışmalar!"
