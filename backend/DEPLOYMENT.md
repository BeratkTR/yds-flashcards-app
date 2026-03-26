# YDS Flashcards Backend Kurulum Rehberi (Production)

Bu backend uygulamasını herhangi bir uzak sunucuya (VPS, DigitalOcean, AWS EC2, Ubuntu) veya platformlara (Render, Railway, Heroku) kurmak için aşağıdaki adımları izleyebilirsiniz.

## 1. Sunucu Gereksinimleri
Sunucunuzda yüklü olması gerekenler:
- **Node.js** (v18 veya üzeri önerilir)
- **PostgreSQL** veritabanı sunucusu (Uygulamanın şifreleri ve durumları kaydedebilmesi için)
- **Git**

## 2. Kodu Sunucuya İndirme
Geçerli projenizi GitHub üzerinden çektiğinizi varsayalım:
```bash
git clone https://github.com/BeratkTR/yds-flashcards-app.git
cd yds-flashcards-app/backend
```

## 3. Bağımlılıkları Yükleme
```bash
npm install
```

## 4. Ortam Değişkenleri (.env) Ayarları
`backend` klasörü içerisine bir `.env` dosyası oluşturun ve şu yapılandırmayı sunucunuza göre düzenleyin:
```env
# Veritabanı Bilgileri (PostgreSQL şifreniz ve DB adı)
DATABASE_URL="postgresql://kullanici_adi:sifre@localhost:5432/yds_db?schema=public"

# Şifreleme ve Oturum (Kendi oluşturacağınız zor bir şifre olsun)
JWT_SECRET="supersafeproductionsecretkey123!?"

# Yapay Zeka için OpenAI API (Cümle üretimi vs için)
OPENAI_API_KEY="sk-proj-sizin-api-keyiniz"
```

## 5. Veritabanı Şemasını Basma (Migration)
Prisma kullanarak ortamınızdaki veritabanını hazırlayın:
```bash
npx prisma generate
npx prisma db push
```

## 6. Projeyi Derleme (TypeScript -> JavaScript)
Node.js sunucularında `.ts` dosyaları yerine `.js` çıktıları çalıştırılır. Bunun için projeyi build edin:
```bash
npm run build
```
*(Bu komut `dist/` adında bir klasör oluşturacaktır)*

## 7. Uygulamayı Canlı (Production) Modda Başlatma
Uygulamayı geliştirme ortamındaki gibi `npm run dev` ile değil, `npm start` ile başlatıyoruz.
Ancak terminali kapattığınızda kapanmaması için `pm2` adlı aracı kurmanız şiddetle tavsiye edilir.

**PM2 Kurulumu ve Başlatma:**
```bash
# PM2'yi global olarak kurun
npm install -g pm2

# Uygulamayı PM2 ile arka planda başlatın
pm2 start npm --name "yds-backend" -- start

# Sunucu her yeniden başladığında (restart atıldığında) otomatik çalışması için:
pm2 startup
pm2 save
```

---

## 8. NGINX ve Ücretsiz SSL (Certbot/Let's Encrypt) Kurulumu (AWS / AL2023 / RHEL / Fedora)

Uygulamanızı 3000 portu yerine doğrudan alan adınız (örn: `api.siteniz.com`) üzerinden ve güvenli **HTTPS (SSL)** sertifikası ile dışarı açmak için Nginx kullanmalısınız.

### Adım 8.1: Nginx ve Certbot'u Kurun
AWS (Amazon Linux 2023 vb.) veya RHEL tabanlı sunucunuzda terminale şu komutları girin:
```bash
sudo dnf update -y
sudo dnf install nginx -y
sudo dnf install certbot python3-certbot-nginx -y
```

### Adım 8.2: Nginx Yapılandırma Dosyası Oluşturun
Domain adresiniz için `conf.d` dizini altında bir Nginx yapılandırma dosyası oluşturun:
```bash
sudo nano /etc/nginx/conf.d/yds-backend.conf
```
Dosyanın içerisine aşağıdakileri yapıştırın (Kendi alan adınızı `api.siteniz.com` kısmına yazın):
```nginx
server {
    listen 80;
    server_name api.siteniz.com; # BURAYI KENDİ DOMAININIZ İLE DEĞİŞTİRİN

    location / {
        proxy_pass http://localhost:3000; # Uygulamanızın çalıştığı port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Gerçek IP adreslerini backend'e iletmek için:
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Kaydedip çıkmak için: `CTRL+X`, `Y`, `Enter`.

### Adım 8.3: Nginx'i Başlatın ve Test Edin
CentOS/RHEL/AL sistemlerinde Nginx'i otomatik başlatmak için enable ediyoruz:
```bash
# Nginx'in sunucu açıldığında otomatik başlamasını sağlayın
sudo systemctl enable nginx

# Nginx ayarlarında yazım hatası olup olmadığını test edin:
sudo nginx -t

# Her şey 'ok' ve 'successful' ise Nginx'i başlatın / yeniden başlatın:
sudo systemctl restart nginx
```

### Adım 8.4: Let's Encrypt ile Otomatik SSL Kurulumu
Aşağıdaki komutu girerek Nginx için otomatik SSL sertifikası alın (Domain'in AWS sunucunuzun IP adresine A kaydı ile yönlendirilmiş olması ZORUNLUDUR):
```bash
sudo certbot --nginx -d api.siteniz.com
```

Bu aşamada size e-posta adresiniz sorulacak ve Kullanım Koşulları'nı kabul etmeniz istenecektir. Sonrasında Certbot otomatik olarak Nginx dosyanızı (yds-backend.conf) düzenleyecek ve SSL (HTTPS) trafiğini kuracaktır.

## 🎉 Tebrikler!
Artık uygulamanız güvenli bir şekilde `https://api.siteniz.com` adresi üzerinden çalışıyor. Flutter uygulamasında veya Frontend `.env` dosyasında API isteklerini bu adrese yönlendirebilirsiniz!
