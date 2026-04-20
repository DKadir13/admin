# Yerel kullanım: Admin'de eklediğin blog/ürün diğer sitede görünsün

Her şey **kendi bilgisayarında** çalışıyor. Admin panelinde eklediğin blog yazısı ve ürünler, diğer sitenin (örn. atakenteczadeposu) ekranında görünsün istiyorsan aşağıdaki sırayı izle.

---

## 1. MongoDB çalışsın

Yerel MongoDB servisinin açık olduğundan emin ol (varsayılan: `mongodb://localhost:27017`).

---

## 2. Admin backend’i çalıştır

Bu projede (admin):

```bash
cd admin/backend
npm install
npm run dev
```

Backend **http://127.0.0.1:3001** adresinde çalışmalı. Konsolda "MongoDB bağlandı" gör.

---

## 3. Admin panelinde blog/ürün ekle

- Tarayıcıda admin frontend’i aç (örn. `cd admin/frontend && npm run dev` → http://localhost:5173).
- Giriş yap, site seç (örn. Atakent Eczadeposu), Blog / Ürünler’e gir ve yazı veya ürün ekle.
- Veriler **yerel MongoDB**’ye yazılır.

---

## 4. Diğer sitede (atakenteczadeposu vb.) API adresini local yap

Diğer projenin (blog/ürünün görüneceği site) **kök klasöründe** `.env` dosyası olsun:

```env
VITE_API_BASE=http://127.0.0.1:3001
VITE_SITE_ID=atakentEczadeposu
```

- `VITE_API_BASE`: Admin backend’in adresi (yerelde **mutlaka** `http://127.0.0.1:3001`).
- `VITE_SITE_ID`: Hangi site için veri çekileceği (admin’de seçtiğin sitenin id’si).

`.env` değiştirdiysen diğer sitedeki dev sunucusunu yeniden başlat (örn. `npm run dev`).

---

## 5. Diğer sitede isteği tam URL ile at

Fetch’te **tam URL** kullan. Relative path kullanma (404 alırsın):

```javascript
const API_BASE = import.meta.env.VITE_API_BASE   // http://127.0.0.1:3001
const SITE_ID = import.meta.env.VITE_SITE_ID || 'atakentEczadeposu'

// Blog
const res = await fetch(`${API_BASE}/api/public/sites/${SITE_ID}/blog`)
const posts = await res.json()

// Ürünler
const resProd = await fetch(`${API_BASE}/api/public/sites/${SITE_ID}/products`)
const products = await resProd.json()
```

---

## 6. Sırayı kontrol et

| Sıra | Ne yapıyorsun | Sonuç |
|------|----------------|--------|
| 1 | MongoDB açık | Veri saklanabilir |
| 2 | `admin/backend` → `npm run dev` | API http://127.0.0.1:3001’de |
| 3 | Admin panelinden blog/ürün ekle | Veri MongoDB’ye yazılır |
| 4 | Diğer sitede `.env` → `VITE_API_BASE=http://127.0.0.1:3001` | İstek doğru adrese gider |
| 5 | Diğer sitede fetch’i tam URL ile kullan | Blog/ürün listesi gelir |

Bu sırayla **backend önce çalışıyor olmalı**. Sonra admin’de eklediğin blog yazısı, diğer sitede açtığın ekranda (blog listesi/detay) düşer. Ürünler için de aynı mantık: aynı backend’den `products` endpoint’ini çekiyorsan, admin’de eklediğin ürünler orada görünür.

---

## Sorun giderme

- **404:** Diğer sitede `VITE_API_BASE` boş veya yanlış. Mutlaka `http://127.0.0.1:3001` yaz, fetch’te `${API_BASE}/api/public/sites/...` kullan (relative `/api/...` kullanma).
- **CORS hatası:** Backend’te CORS açık (`cors({ origin: true })`). Backend’i yeniden başlat.
- **Boş liste:** Backend çalışıyor mu kontrol et: tarayıcıda http://127.0.0.1:3001/api/public/sites/atakentEczadeposu/blog aç; JSON (array) dönmeli. Admin’de ilgili siteden en az bir blog/ürün ekle ve durumu “yayında” / “aktif” yap.
