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

## 🎉 Tebrikler!
Artık backend sunucunuz `http://SUNUCU_IP_ADRESINIZ:3000` üzerinden hizmet vermeye başladı. 
Flutter mobil uygulamasındaki veya React tarafındaki API base_url'nizi bu sunucunun IP adresi ile değiştirerek production'da kullanabilirsiniz.
