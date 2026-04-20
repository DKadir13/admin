# Diğer sitede Blog ve Ürün verilerini kullanmak — Cursor'a yapıştır

Aşağıdaki metni **diğer projenin** Cursor sohbetine tamamen kopyalayıp yapıştır. O projede blog ve ürün sayfalarını bu API'ye bağlamak için gerekli her şeyi anlatıyor.

---

## Cursor'a yapıştırılacak metin (buradan itibaren kopyala)

Bu projede **blog yazıları** ve **ürünler** verisini harici bir API'den çekmem gerekiyor. Aşağıdaki bilgilere göre blog ve ürün bölümlerini bu API'ye bağla.

### API bilgileri
- **Base URL (zorunlu):** Mutlaka **tam adres** kullan. Relative path (`/api/public/...`) kullanma, 404 alırsın.
  - **Yerel (şu an kullanılan):** `http://localhost:3001` — admin backend aynı bilgisayarda çalışıyor olmalı.
  - Canlı: `https://akygroupadminpanel.vercel.app`
- **.env:** Yerelde `VITE_API_BASE=http://localhost:3001` ve `VITE_SITE_ID=atakentEczadeposu` (veya ilgili site id) tanımla.
- **Kimlik doğrulama:** Yok. Public endpoint'ler token istemez.
- **Site ID:** Örnekler: `medicaGlobal`, `akyPharma`, `arthroline`, `medart`, `renova`, `atakentEczadeposu`

### Endpoint'ler

1. **Blog yazıları (liste)**  
   `GET {API_BASE}/api/public/sites/{siteId}/blog`  
   Dönen her öğe: `id`, `title`, `slug`, `content`, `image` (tam URL), `publishedAt`, `createdAt`

2. **Ürünler (liste)**  
   `GET {API_BASE}/api/public/sites/{siteId}/products`  
   Dönen her öğe: `id`, `name`, `slug`, `price`, `description`, `image` (tam URL), `createdAt`

**Önemli:** `image` alanları API'de zaten **tam URL** olarak dönüyor; ek bir birleştirme yapmama gerek yok. Doğrudan `<img src={item.image} />` kullanabilirim.

### Yapılmasını istediğim
1. **Blog sayfası / bölümü:** Bu API'den ilgili `siteId` ile blog listesini çek, listele. İstersen slug ile tekil yazı sayfası da olsun (liste içinden slug ile filtreleyebilirsin).
2. **Ürünler sayfası / bölümü:** Aynı şekilde ürün listesini bu API'den çek, listele. Resim, ad, fiyat, açıklama alanlarını kullan.
3. API base URL ve siteId'yi ortam değişkeni veya config dosyasından okunabilir yap (örn. `VITE_API_BASE`, `VITE_SITE_ID` veya .env).

### Örnek kullanım (referans) — URL mutlaka tam (absolute) olsun
```javascript
// Yerel: VITE_API_BASE=http://localhost:3001 (.env). Admin backend çalışıyor olmalı.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'
const SITE_ID = import.meta.env.VITE_SITE_ID || 'atakentEczadeposu'

// Yanlış: fetch('/api/public/...') → 404 verir (istek kendi siteden gider)
// Doğru: aşağıdaki gibi tam URL
const resBlog = await fetch(`${API_BASE}/api/public/sites/${SITE_ID}/blog`)
const posts = await resBlog.json()

const resProducts = await fetch(`${API_BASE}/api/public/sites/${SITE_ID}/products`)
const products = await resProducts.json()
```

Resimler için: API'den gelen `image` zaten tam URL (örn. `https://.../uploads/xxx.jpg`), doğrudan `<img src={post.image} />` veya `<img src={product.image} />` kullan.

Bu projedeki mevcut blog ve ürün sayfalarını / bileşenlerini yukarıdaki API'ye göre güncelle; veriyi bu endpoint'lerden çeksin, arayüzü projenin mevcut tasarımına uyumlu kalsın.

---

## Cursor'a yapıştırılacak metin (buraya kadar kopyala)

---

*Bu dosyayı kopyala-yapıştır sonrası silebilir veya projede referans için tutabilirsin. Farklı bir site için sadece `SITE_ID` değerini değiştirmen yeterli.*
