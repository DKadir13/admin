# Admin Panel — Sunucu Kurulum & Proje Dokümantasyonu

Bu doküman, bu repodaki admin panelini bir Linux sunucuda çalıştırmak için gerekli adımları ve proje yapısını açıklar.

## Proje yapısı (klasörler)

- **`backend/`**: Node.js (Express) API + MongoDB (Mongoose)
  - Auth (giriş/çıkış), site/blog/ürün CRUD, dosya yükleme, public endpoint’ler.
- **`frontend/`**: React (Vite) admin arayüzü
  - Backend’e istek atar, token’ı localStorage’da tutar.
- **`.github/workflows/deploy.yml`**: GitHub Actions ile sunucuya SSH deploy
- **`.env.example` (kök)**: Mongo base URI + DB adı örneği (backend için)
- **`README.md` / `LOCAL_KULLANIM.md` / `BAGLANTI_KILAVUZU.md`**: Yerel kullanım ve bağlantı kılavuzları

## Backend (API) — önemli dosyalar ve ne işe yarar?

- **`backend/index.js`**
  - Express uygulamasını başlatır.
  - Router’ları `/api/*` altında mount eder.
  - `connectDB()` ile veritabanına bağlanır, `seedSites()` ile ilk veriyi uygular.
  - `GET /api/health` endpoint’i “ayakta mı” kontrolü içindir.

- **`backend/db/connect.js`**
  - Mongo bağlantısını **tamamen environment variables** üzerinden yönetir:
    - `process.env.MONGODB_URI` (base uri, örn `mongodb://localhost:27017`)
    - `process.env.DB_NAME` (db adı, örn `admin_db`)
  - Tanımlı değillerse fallback olarak:
    - `mongodb://localhost:27017`
    - `admin_db`

- **`backend/routes/auth.js`**
  - `POST /api/auth/login`: `{ password }` alır, bcrypt ile doğrular.
  - `POST /api/auth/logout`: token’ı invalid eder.
  - Şu an giriş şifresi “manuel”dir: **`akygroup.2026`** yazınca giriş olur.
    - Şifre düz metin değil; doğrulama bcrypt hash ile yapılır.

- **`backend/middleware/auth.js`**
  - Bearer token doğrulaması (protected endpoint’ler için).
  - Oturum token’larını `Session` modelinde saklar.

- **`backend/routes/*`**
  - `sites.js`, `blog.js`, `products.js`, `upload.js`, `domains.js`, `stats.js`, `public.js` vb. API uçları.

- **`backend/models/*`**
  - Mongo koleksiyon şemaları (Site, Product, BlogPost, Session, vb.).

- **`backend/uploads/`**
  - Yüklenen görsel/doküman dosyalarının tutulduğu klasör.
  - API’de `/uploads` static olarak servis edilir.

## Frontend — önemli dosyalar ve ne işe yarar?

- **`frontend/src/api/client.js`**
  - Tüm API istekleri burada toplanır.
  - **`API_BASE`** tek yerden çözülür:
    - Öncelik: `import.meta.env.VITE_API_BASE`
    - Env yoksa: **aynı origin** kullanır (örn. `http://85.235.74.60`)
  - Bu sayede API çağrıları Nginx üzerinden `/api/*` ile akar.

- **`frontend/src/screens/*`**
  - Yönetim ekranları (BlogPage, ProductsPage, DomainsPage, DashboardPage, LoginPage, vb.).

- **`frontend/.env.example`**
  - Frontend’in backend’e bağlanacağı adres örneği:
    - `VITE_API_BASE=http://85.235.74.60`

## Ortam değişkenleri (ENV)

### Backend ENV (sunucuda `backend/.env`)

Minimum:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017
DB_NAME=admin_db
```

Notlar:
- `MONGODB_URI` burada “base URI” olmalı (db adı `DB_NAME` ile ayrı verilir).
- MongoDB Atlas kullanıyorsan `MONGODB_URI` örn `mongodb+srv://...` olabilir.

### Frontend ENV (deploy ettiğin yere göre)

- Vite env:

```env
VITE_API_BASE=http://85.235.74.60
```

## Sunucuda kurulum (PM2 ile)

Bu bölüm “backend’i sunucuda ayakta tut” kurulumudur.

### 1) Gereksinimler
- Node.js (LTS önerilir)
- MongoDB (lokal veya Atlas)
- PM2

Örnek:

```bash
npm i -g pm2
```

### 2) Repo’yu çek

```bash
cd /var/www
git clone https://github.com/DKadir13/admin.git admin-panel
cd /var/www/admin-panel
```

### 3) Backend’i kur ve çalıştır

```bash
cd /var/www/admin-panel/backend
npm install
```

`backend/.env` oluştur:

```bash
nano /var/www/admin-panel/backend/.env
```

Örnek içerik:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017
DB_NAME=admin_db
```

PM2 ile başlat:

```bash
cd /var/www/admin-panel/backend
pm2 start index.js --name "admin-backend"
pm2 save
```

Sağlık kontrolü:

```bash
curl -i http://127.0.0.1:3001/api/health
```

### 4) Frontend build (sunucuda statik dosya üretmek istersen)

```bash
cd /var/www/admin-panel/frontend
npm install
npm run build
```

Bu build çıktısı `frontend/dist/` altına gider. Bunu Nginx ile servis edebilirsin.

## Nginx (opsiyonel ama önerilir)

Eğer domain üzerinden `/api`’yi 3001’e yönlendirmek istiyorsan tipik yaklaşım:

- Frontend (static) Nginx ile
- Backend `/api` path’i 3001’e proxy

Örnek fikir (tam config sunucuna göre değişir):

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:3001;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## GitHub Actions ile deploy

Workflow: **`.github/workflows/deploy.yml`**

- `main` branch’e push olunca SSH ile sunucuya bağlanır.
- Repo’yu `git pull` eder.
- Backend/Frontend için `npm install` çalıştırır.
- Backend’i PM2 ile:
  - `pm2 restart admin-backend --update-env`
  ile yeniden başlatır.

### GitHub Secret
GitHub’da repo → **Settings → Secrets and variables → Actions**:
- `SERVER_PASSWORD` secret’ını ekle (sunucu root şifren).

## Sık görülen sorunlar

### 1) Login request 502 Bad Gateway
- Bu genelde Nginx upstream / backend down problemidir.
- Önce backend ayakta mı kontrol et:

```bash
curl -i http://127.0.0.1:3001/api/health
pm2 status
pm2 logs admin-backend --lines 200
```

### 2) Frontend “Request URL” localhost görünüyor
- Frontend env’i doğru set et:
  - `VITE_API_BASE=http://85.235.74.60`
- Eğer env yoksa, frontend zaten **aynı origin**’i kullanır (Nginx `/api` proxy gerekir).

