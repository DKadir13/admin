# Admin paneli – Site bağlantısı ve MongoDB

## Yerel kullanım (önce bu)

**Admin’i ve diğer siteyi kendi bilgisayarında çalıştırıyorsan:**  
Detaylı adımlar için **LOCAL_KULLANIM.md** dosyasına bak. Kısaca: (1) MongoDB açık, (2) admin backend çalışsın (`cd backend && npm run dev`), (3) diğer sitede `.env` içinde `VITE_API_BASE=http://localhost:3001` ve `VITE_SITE_ID=atakentEczadeposu` olsun, (4) diğer sitede fetch’te tam URL kullan. Bu şekilde admin’de eklediğin blog/ürün diğer sitede görünür.

---

## Neden sitede eklediğim veriler görünmüyor?

İki senaryo var:

### 1. Her şeyi bilgisayarında (local) çalıştırıyorsan

- Admin panelinde eklediğin ürün/blog **yerel MongoDB**'ye yazılıyor.
- **Diğer siten** (ör. atakenteczadeposu) veriyi **nereden** çekiyor?
  - Eğer diğer sitede `VITE_API_BASE` = `http://localhost:3001` ise → Aynı bilgisayarda **admin backend’i çalışıyor olmalı** (örn. `cd backend && npm run dev`). O zaman sitede veriler görünür.
  - Eğer diğer sitede `VITE_API_BASE` = `https://akygroupadminpanel.vercel.app` (veya başka bir uzak adres) ise → Veri **o sunucudaki API’den** gelir. O sunucu **kendi MongoDB’sine** (genelde uzak / Atlas) bağlıdır. Sen local’de eklediğin veriler orada yok; bu yüzden sitede görünmez.

**Özet (hepsi local):**  
Admin backend’i çalıştır, diğer sitede `VITE_API_BASE=http://localhost:3001` ve doğru `VITE_SITE_ID` kullan. İkisi de aynı bilgisayarda çalışıyorsa, local MongoDB yeterli; eklediğin veriler sitede görünür.

---

### 2. Siten yayında (Vercel / sunucu) çalışıyorsa

- Tarayıcı, **senin bilgisayarına** değil, **internetteki bir adrese** istek atar.
- O yüzden `VITE_API_BASE` mutlaka **yayındaki backend adresi** olmalı (örn. `https://akygroupadminpanel.vercel.app`).
- Yayındaki backend **senin bilgisayarındaki MongoDB’ye (localhost) bağlanamaz**. Sunucu kendi ortamında çalışır, “localhost” orada farklı bir makine.
- Bu yüzden **siten yayındaysa MongoDB’nin uzak (remote) olması gerekir** – örneğin **MongoDB Atlas** (ücretsiz cluster yeterli).

**Özet (site yayında):**  
- Backend’i Vercel (veya başka bir yerde) deploy et.  
- Backend’in `.env`’inde `MONGODB_URI` = **MongoDB Atlas bağlantı string’i** olsun.  
- Diğer sitede `VITE_API_BASE` = bu yayındaki backend adresi olsun.  
Böylece hem admin’den eklediğin veriler hem de siten aynı (uzak) veritabanını kullanır; sitede görünür.

---

## Ne yapmalısın? (Özet tablo)

| Senaryo | MongoDB | Backend nerede? | Diğer sitede VITE_API_BASE |
|--------|---------|------------------|----------------------------|
| Sadece kendi bilgisayarında test | Local (localhost:27017) | Local (localhost:3001) | `http://localhost:3001` |
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

- [ ] Diğer sitede `VITE_API_BASE` doğru mu? (Local test → `http://localhost:3001`, yayın → `https://...` backend adresi)
- [ ] Diğer sitede `VITE_SITE_ID` doğru mu? (örn. `atakentEczadeposu`, `medicaGlobal`)
- [ ] Site yayındaysa backend’te `MONGODB_URI` = MongoDB Atlas connection string mi?
- [ ] Local test ediyorsan admin backend çalışıyor mu? (`cd backend && npm run dev`)
