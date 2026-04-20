# 404 Hatası: api/public/sites/.../blog veya .../products

## Neden oluyor?

Tarayıcı isteği **senin siteden** (veya Vite’ın açtığı porttan) yapıyorsa 404 alırsın. Yani:

- Yanlış: `fetch('/api/public/sites/atakentEczadeposu/blog')`  
  → İstek `https://senin-site.com/api/public/...` veya `http://localhost:5173/api/public/...` adresine gider. Bu adreste böyle bir route yok → **404**.

- Doğru: İstek **admin backend’inin tam adresine** gitmeli:  
  `http://localhost:3001/api/public/sites/atakentEczadeposu/blog` (yerel)

## Ne yapmalısın? (Diğer sitede)

### 1. Ortam değişkeni (Vite) — yerel

**Yerelde (şu an kullan):** Diğer projenin kökünde `.env`, sondaki slash olmasın:

```env
VITE_API_BASE=http://localhost:3001
VITE_SITE_ID=atakentEczadeposu
```

Sonda `/` olmasın. Değişiklikten sonra sunucuyu yeniden başlat. Admin backend de çalışıyor olmalı (`cd admin/backend && npm run dev`).

### 2. Fetch’te mutlaka tam URL kullan

**Yanlış (404 verir):**
```javascript
fetch('/api/public/sites/atakentEczadeposu/blog')
```

**Doğru:**
```javascript
const API_BASE = import.meta.env.VITE_API_BASE
if (!API_BASE) throw new Error('VITE_API_BASE tanımlı değil')

const res = await fetch(`${API_BASE}/api/public/sites/atakentEczadeposu/blog`)
// veya
const SITE_ID = import.meta.env.VITE_SITE_ID || 'atakentEczadeposu'
const res = await fetch(`${API_BASE}/api/public/sites/${SITE_ID}/blog`)
```

Yani URL her zaman **tam adres** olmalı: `http://localhost:3001/api/public/sites/atakentEczadeposu/blog` (yerel)

### 3. Kontrol (yerel)

Admin backend çalışıyorken tarayıcıda aç:

- Blog: http://localhost:3001/api/public/sites/atakentEczadeposu/blog
- Ürünler: http://localhost:3001/api/public/sites/atakentEczadeposu/products

JSON dönüyorsa backend çalışıyordur; sorun diğer sitedeki URL’in yanlış (relative) kullanılmasıdır.

---

**Özet:** 404’ü çözmek için diğer sitede `VITE_API_BASE` tanımla ve fetch’te **mutlaka** `${VITE_API_BASE}/api/public/sites/${SITE_ID}/blog` gibi **tam URL** kullan; relative path (`/api/public/...`) kullanma.
