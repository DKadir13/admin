# Admin Panel

Şirket sitelerinin yönetim paneli: giriş, site seçimi (logo), blog ve ürün yönetimi.

## Yapı

- **frontend/** — React (Vite) uygulaması
- **backend/** — Node.js (Express) API; giriş, siteler, blog ve ürün CRUD

## Gereksinimler

- **MongoDB** yerel olarak çalışıyor olmalı (varsayılan: `mongodb://localhost:27017`).  
  [MongoDB Community Server](https://www.mongodb.com/try/download/community) indirip kurun, servisi başlatın.

## Yerel kullanım: Eklediğin blog/ürün diğer sitede görünsün

Her şeyi kendi bilgisayarında çalıştırıyorsan ve diğer site aynı veriyi gösterecekse → **LOCAL_KULLANIM.md** dosyasına bak. Özet: backend’i çalıştır, diğer sitede `VITE_API_BASE_URL=/api` kullan, fetch/axios isteklerini relative `'/api/...'` üzerinden gönder.

## Çalıştırma

1. **Backend** (önce MongoDB’yi başlatın, sonra backend):
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Varsayılan: (Nginx/proxy ile) `/api`  
   Veritabanı: `MONGODB_URI` (varsayılan: `mongodb://localhost:27017/admin-panel`). İlk çalıştırmada 6 site otomatik seedlenir.

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Varsayılan: http://localhost:5173

3. Tarayıcıda frontend adresini açın.

## API Özeti

- `POST /api/auth/login` — `{ "password": "..." }` → `{ "token": "..." }`
- `POST /api/auth/logout` — Header: `Authorization: Bearer <token>`
- `GET /api/sites` — Site listesi (token gerekli)
- `GET/POST/PUT/DELETE /api/sites/:siteId/blog` — Blog yazıları
- `GET/POST/PUT/DELETE /api/sites/:siteId/products` — Ürünler

Veriler **MongoDB**’de tutulur (veritabanı: `admin-panel`, koleksiyonlar: `sites`, `blogposts`, `products`).

## Ortam değişkenleri (backend)

`backend/.env` içinde örnek:

- `PORT=3001`
- `MONGODB_URI=mongodb://localhost:27017`
- `DB_NAME=admin_db`

## Firma adlarını (site adlarını) düzenleme

Açılış sayfasındaki firma adları **backend/data/sites.json** dosyasından okunur. Backend her başlatıldığında bu dosyadaki kayıtları veritabanına uygular.

- **sites.json** içindeki her nesnede `id`, `name`, `logo`, `apiBaseUrl` alanları olmalı.
- Adları değiştirmek için sadece `name` alanını düzenleyin; **id** değerlerini veritabanındaki mevcut sitelerle aynı tutun (örn. `medicaGlobal`, `akyPharma`).
- Değişiklikten sonra backend'i yeniden başlatın; açılış sayfasında güncel adlar görünür.

Eğer hâlâ "Firma 1", "Firma 2" görüyorsanız: veritabanındaki site **id**'lerini kontrol edin (MongoDB Compass veya mongosh ile `sites` koleksiyonuna bakın). **sites.json** içindeki `id` değerleri bunlarla birebir aynı olmalı; `name` alanlarını istediğiniz firma adlarıyla değiştirip backend'i yeniden başlatın.

## Yeni site (logo) ekleme

1. **Logo dosyasını** `frontend/public/logolar/` klasörüne ekleyin (örn. `7.png`).
2. MongoDB’de `sites` koleksiyonuna yeni belge ekleyin (mongosh veya Compass ile):
   ```json
   { "id": "firma7", "name": "Firma 7", "logo": "/logolar/7.png", "apiBaseUrl": "/api" }
   ```
   İsterseniz ileride backend’e “site ekle” API’si de eklenebilir.
