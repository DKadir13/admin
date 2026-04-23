# Admin paneli – Site bağlantısı ve MongoDB

## Yerel kullanım (önce bu)

**Admin’i ve diğer siteyi kendi bilgisayarında çalıştırıyorsan:**  
Detaylı adımlar için **LOCAL_KULLANIM.md** dosyasına bak. Kısaca: (1) MongoDB açık, (2) admin backend çalışsın (`cd backend && npm run dev`), (3) diğer sitede `.env` içinde `VITE_API_BASE_URL=/api` ve `VITE_SITE_ID=<admin-paneldeki-site-id>` olsun, (4) diğer sitede fetch/axios istekleri relative `'/api/...'` üzerinden gitsin. Bu şekilde admin’de eklediğin blog/ürün diğer sitede görünür.

---

## Neden sitede eklediğim veriler görünmüyor?

İki senaryo var:

### 1. Her şeyi bilgisayarında (local) çalıştırıyorsan

- Admin panelinde eklediğin ürün/blog **yerel MongoDB**'ye yazılıyor.
- **Diğer siten** (ör. atakenteczadeposu) veriyi **nereden** çekiyor?
  - `VITE_API_BASE_URL` her zaman `/api` olmalı. Nginx `/api` isteklerini backend’e (örn. 3001) yönlendirir.

**Özet (hepsi local):**  
Admin backend’i çalıştır, diğer sitede `VITE_API_BASE_URL=/api` ve doğru `VITE_SITE_ID` kullan. İkisi de aynı origin üzerinden servisleniyorsa, eklediğin veriler sitede görünür.

---

### 2. Siten yayında (Vercel / sunucu) çalışıyorsa

- Tarayıcı, **senin bilgisayarına** değil, **internetteki bir adrese** istek atar.
- O yüzden backend adresi frontend’de hardcode edilmez; Nginx proxy üzerinden `/api` kullanılır.
- Yayındaki backend **senin bilgisayarındaki MongoDB’ye (localhost) bağlanamaz**. Sunucu kendi ortamında çalışır, “localhost” orada farklı bir makine.
- Bu yüzden **siten yayındaysa MongoDB’nin uzak (remote) olması gerekir** – örneğin **MongoDB Atlas** (ücretsiz cluster yeterli).

**Özet (site yayında):**  
- Backend’i Vercel (veya başka bir yerde) deploy et.  
- Backend’in `.env`’inde `MONGODB_URI` = **MongoDB Atlas bağlantı string’i** olsun.  
- Diğer sitede `VITE_API_BASE_URL=/api` olsun.  
Böylece hem admin’den eklediğin veriler hem de siten aynı (uzak) veritabanını kullanır; sitede görünür.

---

## Ne yapmalısın? (Özet tablo)

| Senaryo | MongoDB | Backend nerede? | Diğer sitede VITE_API_BASE_URL |
|--------|---------|------------------|----------------------------|
| Sadece kendi bilgisayarında test | Local (localhost:27017) | Local (örn. `127.0.0.1:3001`) | `/api` |
| Siten yayında (Vercel vb.) | **Uzak (MongoDB Atlas)** | Yayında (Vercel vb.) | `https://...` (yayındaki backend) |

---

## MongoDB Atlas (uzak bağlantı) kurulumu

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) → Ücretsiz hesap aç, bir cluster oluştur.
2. **Database Access** → Kullanıcı ekle (şifre belirle).
3. **Network Access** → **Add IP Address** → `0.0.0.0/0` (veya sadece Vercel IP’leri) ekle ki sunucu bağlanabilsin.
4. **Connect** → **Connect your application** → Bağlantı string’ini kopyala. Örnek:
   ```text
   mongodb+srv://kullanici:sifre@cluster0.xxxxx.mongodb.net/admin-panel?retryWrites=true&w=majority
   ```
5. **Admin backend** projesinde (Vercel’e deploy ettiğin yerde) **Environment Variables** kısmına ekle:
   - `MONGODB_URI` = yukarıdaki bağlantı string’i (şifreyi kendi şifrenle değiştir).

Bundan sonra admin panelinden eklediğin ürün/blog, Atlas’taki veritabanına yazılır; yayındaki siten de aynı API’yi kullandığı için eklediğin veriler sitede görünür.

---

## Hızlı kontrol listesi

- [ ] Diğer sitede `VITE_API_BASE_URL` doğru mu? (Her zaman `/api`)
- [ ] Diğer sitede `VITE_SITE_ID` doğru mu? (örn. `atakentEczadeposu`, `medicaGlobal`)
- [ ] Site yayındaysa backend’te `MONGODB_URI` = MongoDB Atlas connection string mi?
- [ ] Local test ediyorsan admin backend çalışıyor mu? (`cd backend && npm run dev`)
