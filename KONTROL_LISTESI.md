# GitHub Aktarım Kontrol Listesi

Bu liste, projenizi GitHub'a yüklemeden önce kontrol etmeniz gereken adımları içerir.

## Hazırlık Adımları

- [ ] GitHub hesabınız aktif ve erişilebilir durumda
- [ ] `appointment-system` adında bir GitHub reposu oluşturdunuz
- [ ] Gerekli yazılımlar (Git, Node.js) bilgisayarınızda kurulu
- [ ] Projenizde hassas bilgiler içeren dosyalar `.gitignore` ile hariç tutuldu
- [ ] `README.md` dosyası hazırlandı ve projenizi anlaşılır şekilde açıklıyor
- [ ] `LICENSE` dosyası eklendi
- [ ] `.env.example` dosyası, gerçek çevre değişkenlerini içermeden hazırlandı

## Aktarım Adımları

- [ ] `make-executable.sh` dosyasını çalıştırarak script'leri çalıştırılabilir hale getirin:
```bash
bash make-executable.sh
```

- [ ] `github-push.sh` dosyasını çalıştırarak projenizi GitHub'a gönderin:
```bash
./github-push.sh
```

## Aktarım Sonrası Kontroller

- [ ] GitHub'daki repo içeriğini kontrol edin
- [ ] Hassas bilgiler (API anahtarları, şifreler vb.) GitHub'a yüklenmediğinden emin olun
- [ ] README dosyasındaki kurulum talimatlarını gözden geçirin
- [ ] Kodun örnek olarak düzgün çalıştığından emin olun

Bu kontrol listesi ✅
